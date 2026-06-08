/**
 * @file kaggle-image-jobs.ts
 * @description Supabase-backed Kaggle image job orchestration.
 */

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  createImagePrompt,
  uploadToSupabaseStorage,
} from "@/lib/server/image-generation";
import type {
  GeneratePanelRequest,
  KaggleImageJobResponse,
  KaggleImageJobStatus,
} from "@/lib/studio/api-contracts";

const execFileAsync = promisify(execFile);
const JOBS_TABLE = "ai_image_jobs";
const DEFAULT_OUTPUT_FILE = "output.png";
const DEFAULT_POLL_MS = 2_000;
const DEFAULT_MAX_POLL_ATTEMPTS = 90;

type KaggleJobRow = {
  id: string;
  panel_id: string;
  status: KaggleImageJobStatus;
  prompt: string;
  result_image_url?: string | null;
  error_message?: string | null;
  provider?: string | null;
  model?: string | null;
};

type SupabaseConfig = {
  url: string;
  serviceKey: string;
};

type KaggleConfig = {
  enabled: boolean;
  username: string;
  key: string;
  kernelRef: string;
  inputDatasetRef: string;
  outputFile: string;
  maxPollAttempts: number;
};

export class KaggleImageJobError extends Error {
  constructor(
    message: string,
    readonly status = 503,
  ) {
    super(message);
    this.name = "KaggleImageJobError";
  }
}

export async function createKagglePanelJob(
  input: GeneratePanelRequest,
): Promise<KaggleImageJobResponse> {
  const kaggle = getKaggleConfig();
  const supabase = getSupabaseConfig();
  const prompt = createImagePrompt(input);
  const job = await insertJob(supabase, {
    panelId: input.panel.id,
    prompt,
    model: kaggle.kernelRef,
  });

  void runKagglePanelJob({ jobId: job.id, input, prompt, kaggle, supabase });

  return toJobResponse(job, DEFAULT_POLL_MS);
}

export async function getKagglePanelJob(
  jobId: string,
): Promise<KaggleImageJobResponse | null> {
  const supabase = getSupabaseConfig();
  const job = await fetchJob(supabase, jobId);
  return job ? toJobResponse(job, DEFAULT_POLL_MS) : null;
}

async function runKagglePanelJob({
  jobId,
  input,
  prompt,
  kaggle,
  supabase,
}: {
  jobId: string;
  input: GeneratePanelRequest;
  prompt: string;
  kaggle: KaggleConfig;
  supabase: SupabaseConfig;
}) {
  try {
    await updateJob(supabase, jobId, { status: "running" });
    const dataUrl = await runKaggleCliJob({ prompt, kaggle });
    const imageUrl = await uploadToSupabaseStorage(
      input.panel.id,
      input.panel.seed,
      dataUrl,
    );
    await updateJob(supabase, jobId, {
      status: "succeeded",
      result_image_url: imageUrl,
      provider: "kaggle",
      model: kaggle.kernelRef,
      error_message: null,
    });
  } catch (error) {
    console.warn("[Kaggle Image Job] Failed:", error);
    await updateJob(supabase, jobId, {
      status: "failed",
      error_message:
        "Kaggle image job failed. Please retry or use another image backend.",
      provider: "kaggle",
      model: kaggle.kernelRef,
    }).catch((updateError) => {
      console.warn("[Kaggle Image Job] Failed to update job:", updateError);
    });
  }
}

async function runKaggleCliJob({
  prompt,
  kaggle,
}: {
  prompt: string;
  kaggle: KaggleConfig;
}) {
  const workdir = await mkdtemp(path.join(tmpdir(), "comic-kaggle-"));
  const datasetDir = path.join(workdir, "dataset");
  const kernelDir = path.join(workdir, "kernel");
  const outputDir = path.join(workdir, "output");

  try {
    await mkdir(datasetDir, { recursive: true });
    await mkdir(kernelDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(
      path.join(workdir, "kaggle.json"),
      JSON.stringify({ username: kaggle.username, key: kaggle.key }),
      "utf-8",
    );
    await execKaggle(["--version"], workdir);
    await writeFile(
      path.join(datasetDir, "prompt.json"),
      JSON.stringify(
        {
          prompt,
          outputFile: kaggle.outputFile,
        },
        null,
        2,
      ),
      "utf-8",
    );
    await writeFile(
      path.join(datasetDir, "dataset-metadata.json"),
      JSON.stringify(
        {
          id: kaggle.inputDatasetRef,
          title:
            kaggle.inputDatasetRef.split("/").at(-1) || "comic-panel-input",
        },
        null,
        2,
      ),
      "utf-8",
    );
    await execKaggle(
      ["datasets", "version", "-p", datasetDir, "-m", "Update comic panel prompt"],
      workdir,
    );
    await writeFile(
      path.join(kernelDir, "kernel-metadata.json"),
      JSON.stringify(
        {
          id: kaggle.kernelRef,
          title: kaggle.kernelRef.split("/").at(-1) || "comic-panel-generator",
          code_file: "kernel.py",
          language: "python",
          kernel_type: "script",
          is_private: true,
          enable_gpu: true,
          dataset_sources: [kaggle.inputDatasetRef],
        },
        null,
        2,
      ),
      "utf-8",
    );
    await writeFile(
      path.join(kernelDir, "kernel.py"),
      createKaggleKernelScript(kaggle.inputDatasetRef, kaggle.outputFile),
      "utf-8",
    );
    await execKaggle(["kernels", "push", "-p", kernelDir], workdir);
    await waitForKernelSuccess(kaggle, workdir);
    await execKaggle(
      ["kernels", "output", kaggle.kernelRef, "-p", outputDir],
      workdir,
    );

    const outputPath = path.join(outputDir, kaggle.outputFile);
    const image = await readFile(outputPath);
    return `data:image/png;base64,${image.toString("base64")}`;
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

async function waitForKernelSuccess(kaggle: KaggleConfig, cwd: string) {
  for (let attempt = 0; attempt < kaggle.maxPollAttempts; attempt += 1) {
    const { stdout } = await execKaggle(
      ["kernels", "status", kaggle.kernelRef],
      cwd,
    );
    const status = stdout.toLowerCase();
    if (status.includes("complete")) {
      return;
    }
    if (status.includes("error") || status.includes("failed")) {
      throw new KaggleImageJobError("Kaggle kernel failed.");
    }
    await sleep(DEFAULT_POLL_MS);
  }

  throw new KaggleImageJobError("Kaggle kernel timed out.", 408);
}

function createKaggleKernelScript(datasetRef: string, outputFile: string) {
  const datasetSlug = datasetRef.split("/").at(-1) || "comic-panel-input";
  return [
    "import json",
    "from pathlib import Path",
    "from PIL import Image, ImageDraw",
    "",
    `input_path = Path('/kaggle/input/${datasetSlug}/prompt.json')`,
    "data = json.loads(input_path.read_text(encoding='utf-8'))",
    "prompt = data.get('prompt', '')[:900]",
    "image = Image.new('RGB', (1024, 1536), (24, 24, 27))",
    "draw = ImageDraw.Draw(image)",
    "draw.rectangle((48, 48, 976, 1488), outline=(139, 92, 246), width=8)",
    "draw.multiline_text((96, 120), prompt, fill=(244, 244, 245), spacing=8)",
    `image.save('/kaggle/working/${outputFile}')`,
    "",
  ].join("\n");
}

async function insertJob(
  config: SupabaseConfig,
  {
    panelId,
    prompt,
    model,
  }: {
    panelId: string;
    prompt: string;
    model: string;
  },
) {
  const response = await supabaseFetch(config, JOBS_TABLE, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      panel_id: panelId,
      status: "queued",
      prompt,
      provider: "kaggle",
      model,
    }),
  });

  if (!response.ok) {
    throw new KaggleImageJobError("Could not create Kaggle image job.");
  }

  const rows = (await response.json()) as KaggleJobRow[];
  return rows[0];
}

async function fetchJob(config: SupabaseConfig, jobId: string) {
  const response = await supabaseFetch(
    config,
    `${JOBS_TABLE}?id=eq.${encodeURIComponent(jobId)}&select=*`,
  );

  if (!response.ok) {
    throw new KaggleImageJobError("Could not load Kaggle image job.");
  }

  const rows = (await response.json()) as KaggleJobRow[];
  return rows[0] || null;
}

async function updateJob(
  config: SupabaseConfig,
  jobId: string,
  patch: Partial<KaggleJobRow>,
) {
  const response = await supabaseFetch(
    config,
    `${JOBS_TABLE}?id=eq.${encodeURIComponent(jobId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    },
  );

  if (!response.ok) {
    throw new KaggleImageJobError("Could not update Kaggle image job.");
  }
}

function toJobResponse(
  job: KaggleJobRow,
  retryAfterMs?: number,
): KaggleImageJobResponse {
  return {
    jobId: job.id,
    panelId: job.panel_id,
    status: job.status,
    imageUrl: job.result_image_url || undefined,
    errorMessage: job.error_message || undefined,
    usedModel: job.model || undefined,
    usedProvider: "kaggle",
    retryAfterMs,
  };
}

async function supabaseFetch(
  config: SupabaseConfig,
  pathAndQuery: string,
  init: RequestInit = {},
) {
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  return fetch(`${config.url}/rest/v1/${pathAndQuery}${separator}`, {
    ...init,
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function execKaggle(args: string[], cwd: string) {
  return execFileAsync("kaggle", args, {
    cwd,
    env: {
      ...process.env,
      KAGGLE_CONFIG_DIR: cwd,
    },
    timeout: 30_000,
  });
}

function getKaggleConfig(): KaggleConfig {
  const enabled = process.env.KAGGLE_ENABLED === "true";
  const username = process.env.KAGGLE_USERNAME || "";
  const key = process.env.KAGGLE_KEY || "";
  const kernelRef = process.env.KAGGLE_KERNEL_REF || "";
  const inputDatasetRef = process.env.KAGGLE_INPUT_DATASET_REF || "";

  if (!enabled) {
    throw new KaggleImageJobError("Kaggle image jobs are disabled.", 503);
  }

  if (!username || !key || !kernelRef || !inputDatasetRef) {
    throw new KaggleImageJobError(
      "Kaggle image jobs are not configured.",
      503,
    );
  }

  return {
    enabled,
    username,
    key,
    kernelRef,
    inputDatasetRef,
    outputFile: process.env.KAGGLE_OUTPUT_FILE || DEFAULT_OUTPUT_FILE,
    maxPollAttempts: Number(process.env.KAGGLE_MAX_POLL_ATTEMPTS) ||
      DEFAULT_MAX_POLL_ATTEMPTS,
  };
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new KaggleImageJobError(
      "Supabase is required for Kaggle image jobs.",
      503,
    );
  }

  return { url, serviceKey };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
