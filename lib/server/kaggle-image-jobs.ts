/**
 * @file kaggle-image-jobs.ts
 * @description Supabase-backed Kaggle image job orchestration.
 */

import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
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
const DEFAULT_POLL_MS = 5_000;
const DEFAULT_MAX_POLL_ATTEMPTS = 90;
const DEFAULT_DIFFUSION_MODEL = "Meina/MeinaMix_V11";

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
  kind: "supabase";
  url: string;
  serviceKey: string;
};

type MemoryConfig = {
  kind: "memory";
};

type JobStoreConfig = SupabaseConfig | MemoryConfig;

type KaggleConfig = {
  enabled: boolean;
  username?: string;
  key?: string;
  apiToken?: string;
  kernelRef: string;
  inputDatasetRef: string;
  outputFile: string;
  maxPollAttempts: number;
  diffusionModel: string;
};

const memoryJobs = new Map<string, KaggleJobRow>();

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
  const jobStore = getJobStoreConfig();
  const prompt = createImagePrompt(input);
  const job = await insertJob(jobStore, {
    panelId: input.panel.id,
    prompt,
    model: kaggle.diffusionModel,
  });

  void runKagglePanelJob({ jobId: job.id, input, prompt, kaggle, jobStore });

  return toJobResponse(job, DEFAULT_POLL_MS);
}

export async function getKagglePanelJob(
  jobId: string,
): Promise<KaggleImageJobResponse | null> {
  const jobStore = getJobStoreConfig();
  const job = await fetchJob(jobStore, jobId);
  return job ? toJobResponse(job, DEFAULT_POLL_MS) : null;
}

async function runKagglePanelJob({
  jobId,
  input,
  prompt,
  kaggle,
  jobStore,
}: {
  jobId: string;
  input: GeneratePanelRequest;
  prompt: string;
  kaggle: KaggleConfig;
  jobStore: JobStoreConfig;
}) {
  try {
    await updateJob(jobStore, jobId, { status: "running" });
    const dataUrl = await runKaggleCliJob({ prompt, kaggle });
    const imageUrl = await uploadToSupabaseStorage(
      input.panel.id,
      input.panel.seed,
      dataUrl,
    );
    await updateJob(jobStore, jobId, {
      status: "succeeded",
      result_image_url: imageUrl,
      provider: "kaggle",
      model: kaggle.diffusionModel,
      error_message: null,
    });
  } catch (error) {
    console.warn("[Kaggle Image Job] Failed:", error);
    await updateJob(jobStore, jobId, {
      status: "failed",
      error_message:
        "Kaggle image job failed. Please retry or use another image backend.",
      provider: "kaggle",
      model: kaggle.diffusionModel,
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
    if (kaggle.username && kaggle.key) {
      await writeFile(
        path.join(workdir, "kaggle.json"),
        JSON.stringify({
          username: kaggle.username,
          key: kaggle.key,
        }),
        "utf-8",
      );
    }
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
          licenses: [{ name: "CC0-1.0" }],
        },
        null,
        2,
      ),
      "utf-8",
    );
    await execKaggle(
      [
        "datasets",
        "version",
        "-p",
        datasetDir,
        "-m",
        "Update comic panel prompt",
      ],
      workdir,
    ).catch(async () => {
      await execKaggle(
        ["datasets", "create", "-p", datasetDir, "--dir-mode", "zip"],
        workdir,
      );
    });
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
          enable_internet: true,
          dataset_sources: [kaggle.inputDatasetRef],
        },
        null,
        2,
      ),
      "utf-8",
    );
    await writeFile(
      path.join(kernelDir, "kernel.py"),
      createKaggleKernelScript(kaggle.outputFile, kaggle.diffusionModel),
      "utf-8",
    );
    await execKaggle(["kernels", "push", "-p", kernelDir], workdir);
    await waitForKernelSuccess(kaggle, workdir);
    const outputPath = path.join(outputDir, kaggle.outputFile);
    await execKaggle(
      ["kernels", "output", kaggle.kernelRef, "-p", outputDir],
      workdir,
    ).catch(async (error) => {
      if (await fileExists(outputPath)) {
        console.warn(
          "[Kaggle Image Job] Output command reported an error after downloading the image.",
          error,
        );
        return;
      }
      throw error;
    });

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

function createKaggleKernelScript(outputFile: string, diffusionModel: string) {
  return [
    "import json",
    "import subprocess",
    "import sys",
    "from pathlib import Path",
    "",
    "MAX_PROMPT_WORDS = 42",
    `MODEL_ID = '${diffusionModel}'`,
    "STYLE_SUFFIX = (",
    "    'masterpiece, best quality, anime comic panel, webtoon, clean line art, '",
    "    'expressive face, dynamic composition, cinematic lighting'",
    ")",
    "NEGATIVE_PROMPT = (",
    "    'low quality, worst quality, blurry, bad anatomy, bad hands, extra fingers, '",
    "    'missing fingers, deformed face, duplicate character, cropped, watermark, '",
    "    'signature, text, speech bubble'",
    ")",
    "",
    "def compact_prompt(value):",
    "    text = ' '.join(str(value or '').replace('\\n', ' ').split())",
    "    text = (",
    "        text.replace('A high-quality comic panel illustration', '')",
    "        .replace('Visual Scene:', '')",
    "        .replace('Story Dialogue Context:', '')",
    "        .replace('Strict Quality:', '')",
    "        .replace('Rendering Seed:', 'seed')",
    "        .replace('Scene:', '')",
    "        .replace('Dialogue mood/context:', '')",
    "        .replace('Quality:', '')",
    "        .replace('Seed:', 'seed')",
    "    )",
    "    words = text.split(' ')",
    "    return ' '.join(words[:MAX_PROMPT_WORDS])",
    "",
    "def ensure_dependencies():",
    "    try:",
    "        import diffusers  # noqa: F401",
    "        import transformers  # noqa: F401",
    "        import accelerate  # noqa: F401",
    "        import safetensors  # noqa: F401",
    "    except Exception:",
    "        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'diffusers', 'transformers', 'accelerate', 'safetensors'])",
    "",
    "def load_pipeline(device, dtype):",
    "    from diffusers import DiffusionPipeline",
    "    pipe = DiffusionPipeline.from_pretrained(",
    "        MODEL_ID,",
    "        torch_dtype=dtype,",
    "        safety_checker=None,",
    "        requires_safety_checker=False,",
    "    )",
    "    pipe = pipe.to(device)",
    "    if hasattr(pipe, 'enable_attention_slicing'):",
    "        pipe.enable_attention_slicing()",
    "    return pipe",
    "",
    "input_root = Path('/kaggle/input')",
    "input_files = list(input_root.glob('**/prompt.json'))",
    "if input_files:",
    "    data = json.loads(input_files[0].read_text(encoding='utf-8'))",
    "else:",
    "    data = {",
    "        'prompt': 'A young Vietnamese swordsman on a snowy mountain bridge at dawn, dramatic fantasy comic panel',",
    `        'outputFile': '${outputFile}',`,
    "    }",
    "prompt = compact_prompt(data.get('prompt'))",
    `output_file = data.get('outputFile') or '${outputFile}'`,
    "",
    "try:",
    "    import torch",
    "except Exception as error:",
    "    raise RuntimeError('PyTorch is missing. Please enable Kaggle GPU runtime.') from error",
    "ensure_dependencies()",
    "",
    "device = 'cuda' if torch.cuda.is_available() else 'cpu'",
    "dtype = torch.float16 if device == 'cuda' else torch.float32",
    "pipe = load_pipeline(device, dtype)",
    "",
    "comic_prompt = f'{prompt}, {STYLE_SUFFIX}'",
    "try:",
    "    image = pipe(",
    "        prompt=comic_prompt,",
    "        negative_prompt=NEGATIVE_PROMPT,",
    "        num_inference_steps=30,",
    "        guidance_scale=7.5,",
    "        width=512,",
    "        height=768,",
    "    ).images[0]",
    "except torch.cuda.OutOfMemoryError:",
    "    torch.cuda.empty_cache()",
    "    print('CUDA out of memory, retrying with smaller image settings.')",
    "    image = pipe(",
    "        prompt=comic_prompt,",
    "        negative_prompt=NEGATIVE_PROMPT,",
    "        num_inference_steps=22,",
    "        guidance_scale=7.5,",
    "        width=384,",
    "        height=576,",
    "    ).images[0]",
    "except Exception as error:",
    "    if device == 'cuda' and 'no kernel image' in str(error).lower():",
    "        raise RuntimeError(",
    "            'Kaggle GPU is incompatible with this diffusion runtime. '",
    "            'Switch GPU runtime or use Imagen instead of returning a low-quality CPU image.'",
    "        ) from error",
    "    raise",
    "output_path = Path('/kaggle/working') / output_file",
    "output_path.parent.mkdir(parents=True, exist_ok=True)",
    "image.save(output_path)",
    "",
  ].join("\n");
}

async function insertJob(
  config: JobStoreConfig,
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
  if (config.kind === "memory") {
    const row: KaggleJobRow = {
      id: crypto.randomUUID(),
      panel_id: panelId,
      status: "queued",
      prompt,
      provider: "kaggle",
      model,
    };
    memoryJobs.set(row.id, row);
    return row;
  }

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

async function fetchJob(config: JobStoreConfig, jobId: string) {
  if (config.kind === "memory") {
    return memoryJobs.get(jobId) || null;
  }

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
  config: JobStoreConfig,
  jobId: string,
  patch: Partial<KaggleJobRow>,
) {
  if (config.kind === "memory") {
    const row = memoryJobs.get(jobId);
    if (!row) {
      throw new KaggleImageJobError("Could not update Kaggle image job.");
    }
    memoryJobs.set(jobId, { ...row, ...patch });
    return;
  }

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
      ...(kaggleEnvFromProcess()),
      KAGGLE_CONFIG_DIR: cwd,
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
    },
    timeout: 30_000,
  });
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getKaggleConfig(): KaggleConfig {
  const enabled = process.env.KAGGLE_ENABLED === "true";
  const username = process.env.KAGGLE_USERNAME || "";
  const key = process.env.KAGGLE_KEY || "";
  const apiToken = process.env.KAGGLE_API_TOKEN || "";
  const kernelRef = process.env.KAGGLE_KERNEL_REF || "";
  const inputDatasetRef = process.env.KAGGLE_INPUT_DATASET_REF || "";

  if (!enabled) {
    throw new KaggleImageJobError("Kaggle image jobs are disabled.", 503);
  }

  if ((!apiToken && (!username || !key)) || !kernelRef || !inputDatasetRef) {
    throw new KaggleImageJobError(
      "Kaggle image jobs are not configured.",
      503,
    );
  }

  return {
    enabled,
    username: username || undefined,
    key: key || undefined,
    apiToken: apiToken || undefined,
    kernelRef,
    inputDatasetRef,
    outputFile: process.env.KAGGLE_OUTPUT_FILE || DEFAULT_OUTPUT_FILE,
    maxPollAttempts: Number(process.env.KAGGLE_MAX_POLL_ATTEMPTS) ||
      DEFAULT_MAX_POLL_ATTEMPTS,
    diffusionModel: process.env.KAGGLE_DIFFUSION_MODEL ||
      DEFAULT_DIFFUSION_MODEL,
  };
}

function kaggleEnvFromProcess() {
  const apiToken = process.env.KAGGLE_API_TOKEN;
  if (apiToken) {
    return { KAGGLE_API_TOKEN: apiToken };
  }

  return {
    KAGGLE_USERNAME: process.env.KAGGLE_USERNAME || "",
    KAGGLE_KEY: process.env.KAGGLE_KEY || "",
  };
}

function getJobStoreConfig(): JobStoreConfig {
  if (process.env.KAGGLE_JOB_STORE === "memory") {
    return { kind: "memory" };
  }

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

  return { kind: "supabase", url, serviceKey };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
