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
};

export function getProviderStatuses({
  geminiKey,
  huggingFaceToken,
  imageBackendUrl,
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
  ];
}

export function getPublicImageBackendUrl() {
  return process.env.NEXT_PUBLIC_IMAGE_BACKEND_URL || "";
}
