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

export const GEMINI_IMAGE_MODELS_POOL = ["imagen-4.0-generate-001"];

export const DEFAULT_HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
export const DEFAULT_HF_INFERENCE_PROVIDER = "nscale";
export const DEFAULT_HF_IMAGE_SIZE = "1024x1024";
export const DEFAULT_IMAGEN_IMAGE_MODEL = "imagen-4.0-generate-001";

export async function translateRequestToEnglish(
  input: GeneratePanelRequest,
  apiKey?: string,
): Promise<GeneratePanelRequest> {
  if (!apiKey) {
    return input;
  }

  try {
    const translatedScenePrompt = await translateToEnglish(
      input.panel.scenePrompt,
      apiKey,
    );
    const translatedCharacters = await Promise.all(
      input.characters.map(async (char) => ({
        ...char,
        description: await translateToEnglish(char.description, apiKey),
      })),
    );

    return {
      ...input,
      panel: {
        ...input.panel,
        scenePrompt: translatedScenePrompt,
      },
      characters: translatedCharacters,
    };
  } catch (err) {
    console.warn("[Translate Request] Failed to translate inputs:", err);
    return input;
  }
}

async function translateToEnglish(
  text: string,
  apiKey: string,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }

  // Skip translation if the text is already strictly English (ASCII alphanumeric and punctuation)
  if (/^[a-zA-Z0-9\s,.:;?!"'()_/\-\\#$£€%&*+=|<>~`@]*$/.test(trimmed)) {
    return text;
  }

  const modelsPool = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
  ];

  const uniqueModels = Array.from(new Set(modelsPool));

  for (const model of uniqueModels) {
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate the following character appearance description or visual comic scene description into descriptive English suitable for an AI image generator. Do not translate proper names unless necessary. Return ONLY the English translation. Do not include any explanations, introduction, quotes or other text:\n\n${trimmed}`,
                  },
                ],
              },
            ],
          }),
        },
        8000,
      );

      if (response.ok) {
        const data: unknown = await response.json();
        const translated = extractGeminiTextLocal(data).trim();
        if (translated) {
          return translated;
        }
      } else {
        const statusText = await response.text().catch(() => "");
        console.warn(
          `[Translate to English] Model ${model} returned status ${response.status}: ${statusText}`,
        );
      }
    } catch (err) {
      console.warn(`[Translate to English] Model ${model} failed:`, err);
    }
  }

  return text;
}

function extractGeminiTextLocal(data: unknown): string {
  try {
    const obj = data as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };
    return obj?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}

export async function generatePanelImageFromProvider(
  input: GeneratePanelRequest,
  customHfToken?: string,
  customGeminiApiKey?: string,
): Promise<GeneratePanelResponse> {
  const geminiApiKey = customGeminiApiKey || process.env.GEMINI_API_KEY;
  const translatedInput = await translateRequestToEnglish(input, geminiApiKey);

  const response = await generateRawPanelImage(
    translatedInput,
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
    try {
      const prompt = createImagePrompt(input);
      return await generateHuggingFaceImage({
        apiToken: hfToken,
        prompt,
        panelId: input.panel.id,
        seed: input.panel.seed,
      });
    } catch (err) {
      console.warn("[Hugging Face] Inference failed, trying Imagen...", err);
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

  const resolvedStyle =
    panel.style && panel.style !== "inherit" ? panel.style : "webtoon";
  const styleModifier =
    COMIC_STYLE_MODIFIERS[
      resolvedStyle as keyof typeof COMIC_STYLE_MODIFIERS
    ] || COMIC_STYLE_MODIFIERS.webtoon;

  const characterHeading =
    selectedCharacters.length > 0
      ? `Characters appearing in this panel:\n` +
        selectedCharacters
          .map(
            (character) =>
              `- ${character.name}: ${compactPromptText(character.description, 80)}`,
          )
          .join("\n")
      : "";

  return [
    `Comic panel, ${styleModifier}`,
    characterHeading,
    `Scene description: ${compactPromptText(panel.scenePrompt, 100)}`,
    "Quality: clean line art, clear face, same face shape and facial features for each character across panels, consistent character identity, change only hair style, clothing, makeup, expressions, and poses as needed, polished color, no text, no words, no letters, no speech bubbles, no dialogue bubbles, no captions, strictly image only",
    `Seed: ${panel.seed}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function compactPromptText(value: string, maxWords: number) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, maxWords)
    .join(" ");
}

async function generateHuggingFaceImage({
  apiToken,
  prompt,
  panelId,
  seed,
}: {
  apiToken: string;
  prompt: string;
  panelId: string;
  seed: number;
}): Promise<GeneratePanelResponse> {
  const hfModel = process.env.HF_IMAGE_MODEL || DEFAULT_HF_IMAGE_MODEL;
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
        model: hfModel,
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
      usedModel: hfModel,
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
    usedModel: hfModel,
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
