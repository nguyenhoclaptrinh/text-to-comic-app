/**
 * @file image-generation.ts
 * @description Server-side image generation adapter with cached fallback.
 */

import { createCachedPanelImage } from "@/lib/studio/cached-images";
import { slugifyCharacterName } from "@/lib/studio/storyboard";
import { COMIC_STYLE_MODIFIERS } from "@/lib/studio/constants";
import {
  createAiProviderErrorFromResponse,
  createModelCandidates,
  fetchWithTimeout,
  getAiTimeoutMs,
  parseModelList,
  routeAiModels,
} from "@/lib/server/ai-router";
import {
  isDemoFallbackEnabled,
  isSupabaseRuntimeConfigured,
} from "@/lib/server/runtime-config";
import type {
  GeneratePanelRequest,
  GeneratePanelResponse,
} from "@/lib/studio/api-contracts";

export const GEMINI_IMAGE_MODELS_POOL = [
  "imagen-4.0-generate-001",
];

export const DEFAULT_HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
export const HF_MANGA_ANIME_MODEL_FALLBACK = "stabilityai/stable-diffusion-3-medium-diffusers";
export const HF_COMIC_GENERAL_MODEL_FALLBACK = "stabilityai/stable-diffusion-3-medium-diffusers";
export const DEFAULT_HF_INFERENCE_PROVIDER = "nscale";
export const DEFAULT_HF_IMAGE_SIZE = "1024x1024";
export const DEFAULT_IMAGEN_IMAGE_MODEL = "imagen-4.0-generate-001";

export async function generatePanelImageFromProvider(
  input: GeneratePanelRequest,
  customHfToken?: string,
  customGeminiApiKey?: string,
): Promise<GeneratePanelResponse> {
  const response = await generateRawPanelImage(
    input,
    customHfToken,
    customGeminiApiKey,
  );
  const cloudUrl = await uploadToSupabaseStorage(
    input.panel.id,
    input.panel.seed,
    response.imageUrl,
  );

  return {
    ...response,
    imageUrl: cloudUrl,
    source:
      cloudUrl.startsWith("http") && !cloudUrl.startsWith("data:")
        ? "image-backend"
        : response.source,
    usedModel: response.usedModel,
    usedProvider: response.usedProvider,
  };
}

async function generateRawPanelImage(
  input: GeneratePanelRequest,
  customHfToken?: string,
  customGeminiApiKey?: string,
): Promise<GeneratePanelResponse> {
  if (input.panel.scenePrompt.toLowerCase().includes("[offline]")) {
    throw new Error("Image backend is offline.");
  }

  // 1. Thử dùng Hugging Face trước vì user có thể chọn model comic tốt hơn.
  const hfToken = customHfToken || process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) {
    const defaultModel = process.env.HF_IMAGE_MODEL || DEFAULT_HF_IMAGE_MODEL;
    const prompt = createImagePrompt(input);
    try {
      console.log(`[Hugging Face] Attempting default image model: ${defaultModel}`);
      return await generateHuggingFaceImage({
        apiToken: hfToken,
        prompt,
        panelId: input.panel.id,
        seed: input.panel.seed,
        modelName: defaultModel,
      });
    } catch (err) {
      console.warn(`[Hugging Face] Default model ${defaultModel} failed. Checking fallback...`, err);

      const resolvedStyle =
        input.panel.style && input.panel.style !== "inherit"
          ? input.panel.style
          : "webtoon";
      const fallbackModel =
        resolvedStyle === "manga" || resolvedStyle === "webtoon"
          ? HF_MANGA_ANIME_MODEL_FALLBACK
          : HF_COMIC_GENERAL_MODEL_FALLBACK;

      try {
        console.log(
          `[Hugging Face Fallback] Attempting fallback model: ${fallbackModel} (style: ${resolvedStyle})`,
        );
        return await generateHuggingFaceImage({
          apiToken: hfToken,
          prompt,
          panelId: input.panel.id,
          seed: input.panel.seed,
          modelName: fallbackModel,
        });
      } catch (fallbackErr) {
        console.warn(
          `[Hugging Face Fallback] Model ${fallbackModel} also failed. Proceeding to other providers...`,
          fallbackErr,
        );
      }
    }
  }

  // 2. Thử dùng Imagen 4 Generate cho ảnh panel.
  const geminiApiKey = customGeminiApiKey || process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const prompt = createImagePrompt(input);
      const { base64, mimeType, usedModel } =
        await generateImagenImageWithRotation({
          apiKey: geminiApiKey,
          prompt,
        });

      const imageUrl = `data:${mimeType};base64,${base64}`;

      return {
        panelId: input.panel.id,
        imageUrl,
        source: "image-backend",
        usedModel,
        usedProvider: "imagen",
      };
    } catch (err) {
      console.warn("[Imagen Image] Failed, trying fallback backends...", err);
    }
  }

  // 3. Thử dùng IMAGE_BACKEND_URL
  const endpoint = process.env.IMAGE_BACKEND_URL;
  if (endpoint) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: createImagePrompt(input),
            panel: input.panel,
            characters: input.characters,
          }),
        },
        getAiTimeoutMs(),
      );

      if (response.ok) {
        const data: unknown = await response.json();
        if (isRecord(data) && typeof data.imageUrl === "string") {
          return {
            panelId: input.panel.id,
            imageUrl: data.imageUrl,
            source: "image-backend",
            usedProvider: "image-backend",
          };
        }
      }
    } catch (err) {
      console.warn("[Image Backend] Failed, trying HuggingFace...", err);
    }
  }

  return createFallbackPanelImageResponse(
    input,
    "HuggingFace/Imagen/Image backend is not configured or failed.",
  );
}

function createFallbackPanelImageResponse(
  input: GeneratePanelRequest,
  warning: string,
): GeneratePanelResponse {
  if (!isDemoFallbackEnabled()) {
    throw new Error(warning);
  }

  return {
    panelId: input.panel.id,
    imageUrl: createCachedPanelImage(input.panel),
    source: "fallback",
    warning,
    usedProvider: "fallback",
  };
}

export function createImagePrompt({ panel, characters }: GeneratePanelRequest) {
  const selectedCharacters = panel.characterIds
    .map((characterId) =>
      characters.find(
        (character) =>
          character.id === characterId ||
          slugifyCharacterName(character.name) === characterId,
      ),
    )
    .filter(isDefined);

  const characterContext = selectedCharacters
    .map(
      (character) =>
        `character ${character.name} (described as: ${compactPromptText(character.description, 40)})`,
    )
    .join(", ");

  const resolvedStyle =
    panel.style && panel.style !== "inherit" ? panel.style : "webtoon";
  const styleModifier =
    COMIC_STYLE_MODIFIERS[
      resolvedStyle as keyof typeof COMIC_STYLE_MODIFIERS
    ] || COMIC_STYLE_MODIFIERS.webtoon;

  const characterHeading =
    selectedCharacters.length > 0
      ? `featuring ${characterContext}`
      : "";

  return [
    `Comic panel, ${styleModifier}`,
    characterHeading,
    `Scene: ${compactPromptText(panel.scenePrompt, 100)}`,
    panel.dialogue
      ? `Dialogue context: character is speaking with expression matching the scene. Do not draw any text or speech bubbles.`
      : "",
    "Quality: clean line art, clear face, same face shape and facial features for each character across panels, consistent character identity, change only hair style, clothing, makeup, expressions, and poses as needed, polished color, no text, no words, no speech bubbles, no dialogue bubbles, no captions",
    `Seed: ${panel.seed}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function compactPromptText(value: string, maxWords: number) {
  return value.replace(/\s+/g, " ").trim().split(" ").slice(0, maxWords).join(
    " ",
  );
}

async function generateHuggingFaceImage({
  apiToken,
  prompt,
  panelId,
  seed,
  modelName,
}: {
  apiToken: string;
  prompt: string;
  panelId: string;
  seed: number;
  modelName: string;
}): Promise<GeneratePanelResponse> {
  const hfProvider =
    process.env.HF_INFERENCE_PROVIDER || DEFAULT_HF_INFERENCE_PROVIDER;
  const hfEndpoint =
    process.env.HF_IMAGE_ENDPOINT ||
    `https://router.huggingface.co/${hfProvider}/v1/images/generations`;
  const hfImageSize = process.env.HF_IMAGE_SIZE || DEFAULT_HF_IMAGE_SIZE;
  const response = await fetchWithTimeout(
    hfEndpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        Accept: "image/png",
      },
      body: JSON.stringify({
        model: modelName,
        prompt,
        size: hfImageSize,
        n: 1,
        response_format: "b64_json",
        extra_body: {
          num_inference_steps: 8,
          guidance_scale: 3.5,
          seed,
        },
      }),
    },
    getAiTimeoutMs(),
  );

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw createAiProviderErrorFromResponse(response, detail);
  }

  if (contentType.includes("application/json")) {
    const data: unknown = await response.json();
    const imageBase64 = getHuggingFaceBase64Image(data);
    if (!imageBase64) {
      throw createAiProviderErrorFromResponse(
        response,
        "Hugging Face response did not include an image.",
      );
    }

    return {
      panelId,
      imageUrl: `data:image/png;base64,${imageBase64}`,
      source: "image-backend",
      usedModel: modelName,
      usedProvider: "huggingface",
    };
  }

  if (!contentType.startsWith("image/")) {
    throw createAiProviderErrorFromResponse(
      response,
      `Unexpected Hugging Face response type: ${contentType || "unknown"}.`,
    );
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return {
    panelId,
    imageUrl: `data:${contentType};base64,${base64}`,
    source: "image-backend",
    usedModel: modelName,
    usedProvider: "huggingface",
  };
}

function getHuggingFaceBase64Image(data: unknown) {
  if (!isRecord(data) || !Array.isArray(data.data)) {
    return undefined;
  }

  const firstImage = data.data[0];
  if (!isRecord(firstImage)) {
    return undefined;
  }

  return typeof firstImage.b64_json === "string"
    ? firstImage.b64_json
    : undefined;
}

async function generateImagenImageWithRotation({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}): Promise<{ base64: string; mimeType: string; usedModel: string }> {
  const models = parseModelList(
    process.env.IMAGEN_IMAGE_MODELS || process.env.GEMINI_IMAGE_MODELS,
    GEMINI_IMAGE_MODELS_POOL,
  );
  const candidates = createModelCandidates({
    provider: "imagen",
    capability: "image",
    models,
  });

  const routed = await routeAiModels({
    candidates,
    policy: { maxAttempts: models.length, timeoutMs: getAiTimeoutMs() },
    run: async (candidate) => {
      console.log(
        `[Imagen Image Rotation] Attempting image generation with model: ${candidate.model}`,
      );
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidate.model}:predict?key=${apiKey}`;
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "3:4",
            },
          }),
        },
        getAiTimeoutMs(),
      );

      if (response.ok) {
        const data: unknown = await response.json();
        if (
          isRecord(data) &&
          Array.isArray(data.predictions) &&
          data.predictions.length > 0 &&
          isRecord(data.predictions[0]) &&
          typeof data.predictions[0].bytesBase64Encoded === "string"
        ) {
          const prediction = data.predictions[0] as Record<string, unknown>;
          const base64 = prediction.bytesBase64Encoded as string;
          const mimeType =
            typeof prediction.mimeType === "string"
              ? prediction.mimeType
              : "image/png";
          return { base64, mimeType };
        }
      }

      const errText = await response.text().catch(() => "");
      throw createAiProviderErrorFromResponse(response, errText);
    },
  });

  if (routed.ok) {
    return { ...routed.value, usedModel: routed.model };
  }

  throw new Error(routed.warning);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export async function uploadToSupabaseStorage(
  panelId: string,
  seed: number,
  imageUrl: string,
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !isSupabaseRuntimeConfigured({
      url,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }) ||
    !serviceKey
  ) {
    return imageUrl;
  }

  try {
    let body: ArrayBuffer;
    let contentType = "image/png";

    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return imageUrl;
      }
      contentType = match[1];
      body = new Uint8Array(Buffer.from(match[2], "base64")).buffer;
    } else {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        return imageUrl;
      }
      body = await res.arrayBuffer();
      contentType = res.headers.get("content-type") || "image/png";
    }

    const filename = `${panelId}-${seed}.png`;
    const uploadUrl = `${url}/storage/v1/object/comic-panels/${filename}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    });

    if (!uploadRes.ok) {
      console.warn("[Supabase Storage] Upload failed:", uploadRes.statusText);
      return imageUrl;
    }

    return `${url}/storage/v1/object/public/comic-panels/${filename}`;
  } catch (error) {
    console.warn("[Supabase Storage] Error uploading image:", error);
    return imageUrl;
  }
}
