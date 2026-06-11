/**
 * @file production-config.ts
 * @description Browser-safe production configuration helpers.
 */

export type ProviderStatus = {
  label: string;
  configured: boolean;
  source: "local" | "environment" | "missing";
};

export type BrowserProviderConfig = {
  geminiKey?: string;
  huggingFaceToken?: string;
  imageBackendUrl?: string;
  kaggleEnabled?: boolean;
};

export type AiModelPoolSummary = {
  label: string;
  models: string[];
};

export const DEFAULT_GEMINI_TEXT_MODEL_POOL = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

export const DEFAULT_GEMINI_IMAGE_MODEL_POOL = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-2.5-flash",
];

export const DEFAULT_HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-dev:fastest";
export const DEFAULT_KAGGLE_IMAGE_MODEL = "Meina/MeinaMix_V11";

export function getProviderStatuses({
  geminiKey,
  huggingFaceToken,
  imageBackendUrl,
  kaggleEnabled,
}: BrowserProviderConfig): ProviderStatus[] {
  return [
    {
      label: "Gemini phân tích truyện",
      configured: Boolean(geminiKey),
      source: geminiKey ? "local" : "missing",
    },
    {
      label: "HuggingFace vẽ ảnh",
      configured: Boolean(huggingFaceToken),
      source: huggingFaceToken ? "local" : "missing",
    },
    {
      label: "Image backend riêng",
      configured: Boolean(imageBackendUrl),
      source: imageBackendUrl ? "environment" : "missing",
    },
    {
      label: "Kaggle vẽ ảnh async",
      configured: Boolean(kaggleEnabled),
      source: kaggleEnabled ? "environment" : "missing",
    },
  ];
}

export function getPublicImageBackendUrl() {
  return process.env.NEXT_PUBLIC_IMAGE_BACKEND_URL || "";
}

export function getPublicKaggleEnabled() {
  return process.env.NEXT_PUBLIC_KAGGLE_ENABLED === "true";
}

export function getPublicKaggleImageModel() {
  return (
    process.env.NEXT_PUBLIC_KAGGLE_DIFFUSION_MODEL ||
    DEFAULT_KAGGLE_IMAGE_MODEL
  );
}

export function getDefaultAiModelPools(): AiModelPoolSummary[] {
  return [
    {
      label: "Phân tích truyện",
      models: DEFAULT_GEMINI_TEXT_MODEL_POOL,
    },
    {
      label: "Vẽ ảnh Gemini",
      models: DEFAULT_GEMINI_IMAGE_MODEL_POOL,
    },
    {
      label: "Ảnh Hugging Face",
      models: [DEFAULT_HF_IMAGE_MODEL],
    },
    {
      label: "Ảnh Kaggle",
      models: [getPublicKaggleImageModel()],
    },
  ];
}

export function getLastAiRoute(
  storage: Pick<Storage, "getItem"> | undefined,
  scope: "text" | "image",
) {
  if (!storage) {
    return { provider: "", model: "" };
  }

  return {
    provider: storage.getItem(`text-to-comic:last-${scope}-provider`) || "",
    model: storage.getItem(`text-to-comic:last-${scope}-model`) || "",
  };
}
