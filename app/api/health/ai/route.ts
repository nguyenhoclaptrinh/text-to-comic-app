/**
 * @file route.ts
 * @description AI provider health/configuration diagnostics for seminar checks.
 */

import { NextResponse } from "next/server";

import {
  DEFAULT_HF_IMAGE_MODEL,
  DEFAULT_HF_IMAGE_SIZE,
  DEFAULT_HF_INFERENCE_PROVIDER,
  GEMINI_IMAGE_MODELS_POOL,
} from "@/lib/server/image-generation";
import { GEMINI_TEXT_MODELS_POOL } from "@/lib/server/gemini-storyboard";
import {
  getMaskedConfigValue,
  isDebugAiLoggingEnabled,
  isDemoFallbackEnabled,
} from "@/lib/server/runtime-config";

export async function GET() {
  const hfProvider =
    process.env.HF_INFERENCE_PROVIDER || DEFAULT_HF_INFERENCE_PROVIDER;
  const hfEndpoint =
    process.env.HF_IMAGE_ENDPOINT ||
    `https://router.huggingface.co/${hfProvider}/v1/images/generations`;

  return NextResponse.json({
    ok: true,
    routes: {
      storyboard: "/api/storyboard",
      generatePanel: "/api/generate-panel",
      kaggleJobs: "/api/kaggle-panel-jobs",
    },
    fallback: {
      demoFallbackEnabled: isDemoFallbackEnabled(),
      debugAiLoggingEnabled: isDebugAiLoggingEnabled(),
    },
    providers: {
      huggingFace: {
        configured: Boolean(process.env.HUGGINGFACE_API_TOKEN),
        token: getMaskedConfigValue(process.env.HUGGINGFACE_API_TOKEN),
        model: process.env.HF_IMAGE_MODEL || DEFAULT_HF_IMAGE_MODEL,
        provider: hfProvider,
        endpoint: hfEndpoint,
        size: process.env.HF_IMAGE_SIZE || DEFAULT_HF_IMAGE_SIZE,
      },
      imagen: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        key: getMaskedConfigValue(process.env.GEMINI_API_KEY),
        models:
          process.env.IMAGEN_IMAGE_MODELS ||
          process.env.GEMINI_IMAGE_MODELS ||
          GEMINI_IMAGE_MODELS_POOL.join(","),
      },
      geminiStoryboard: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        key: getMaskedConfigValue(process.env.GEMINI_API_KEY),
        models:
          process.env.GEMINI_TEXT_MODELS || GEMINI_TEXT_MODELS_POOL.join(","),
      },
      imageBackend: {
        configured: Boolean(process.env.IMAGE_BACKEND_URL),
        endpoint: getPublicUrlPreview(process.env.IMAGE_BACKEND_URL),
      },
      kaggle: {
        enabled: process.env.KAGGLE_ENABLED === "true",
        publicEnabled: process.env.NEXT_PUBLIC_KAGGLE_ENABLED === "true",
        configured: Boolean(
          process.env.KAGGLE_API_TOKEN ||
            (process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY),
        ),
        token: getMaskedConfigValue(process.env.KAGGLE_API_TOKEN),
        username: getMaskedConfigValue(process.env.KAGGLE_USERNAME),
        kernelRef: process.env.KAGGLE_KERNEL_REF || "",
        inputDatasetRef: process.env.KAGGLE_INPUT_DATASET_REF || "",
        jobStore: process.env.KAGGLE_JOB_STORE || "supabase",
      },
      supabase: {
        configured: Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
            (process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        ),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        serviceRoleKey: getMaskedConfigValue(
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        ),
        anonKey: getMaskedConfigValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
    },
  });
}

function getPublicUrlPreview(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[configured]";
  }
}
