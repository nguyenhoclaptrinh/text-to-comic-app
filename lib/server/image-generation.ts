/**
 * @file image-generation.ts
 * @description Server-side image generation adapter with cached fallback.
 */

import { createCachedPanelImage } from "@/lib/studio/cached-images";
import { slugifyCharacterName } from "@/lib/studio/storyboard";
import { COMIC_STYLE_MODIFIERS } from "@/lib/studio/constants";
import type {
  GeneratePanelRequest,
  GeneratePanelResponse,
} from "@/lib/studio/api-contracts";

export async function generatePanelImageFromProvider(
  input: GeneratePanelRequest,
  customHfToken?: string,
): Promise<GeneratePanelResponse> {
  const response = await generateRawPanelImage(input, customHfToken);
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
  };
}

async function generateRawPanelImage(
  input: GeneratePanelRequest,
  customHfToken?: string,
): Promise<GeneratePanelResponse> {
  if (input.panel.scenePrompt.toLowerCase().includes("[offline]")) {
    throw new Error("Image backend is offline.");
  }

  // 1. Thử dùng Google AI Studio Imagen 4 nếu có GEMINI_API_KEY
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const prompt = createImagePrompt(input);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            outputMimeType: "image/png",
          },
        }),
      });

      if (response.ok) {
        const data: unknown = await response.json();
        if (
          isRecord(data) &&
          Array.isArray(data.predictions) &&
          data.predictions.length > 0 &&
          isRecord(data.predictions[0]) &&
          typeof data.predictions[0].bytesBase64Encoded === "string"
        ) {
          const base64 = data.predictions[0].bytesBase64Encoded;
          const mimeType =
            typeof data.predictions[0].mimeType === "string"
              ? data.predictions[0].mimeType
              : "image/png";
          const imageUrl = `data:${mimeType};base64,${base64}`;

          return {
            panelId: input.panel.id,
            imageUrl,
            source: "image-backend",
          };
        }
      } else {
        const errText = await response.text().catch(() => "");
        console.warn(
          `[Gemini Imagen] API returned error status ${response.status}:`,
          errText,
        );
      }
    } catch (err) {
      console.warn("[Gemini Imagen] Failed, trying other backends...", err);
    }
  }

  // 2. Thử dùng IMAGE_BACKEND_URL
  const endpoint = process.env.IMAGE_BACKEND_URL;
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: createImagePrompt(input),
          panel: input.panel,
          characters: input.characters,
        }),
      });

      if (response.ok) {
        const data: unknown = await response.json();
        if (isRecord(data) && typeof data.imageUrl === "string") {
          return {
            panelId: input.panel.id,
            imageUrl: data.imageUrl,
            source: "image-backend",
          };
        }
      }
    } catch (err) {
      console.warn("[Image Backend] Failed, trying HuggingFace...", err);
    }
  }

  // 3. Thử dùng Hugging Face Inference API nếu có Token
  const hfToken = customHfToken || process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) {
    try {
      const prompt = createImagePrompt(input);
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${hfToken}`,
          },
          body: JSON.stringify({ inputs: prompt }),
        },
      );

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = response.headers.get("content-type") || "image/png";
        const imageUrl = `data:${contentType};base64,${base64}`;

        return {
          panelId: input.panel.id,
          imageUrl,
          source: "image-backend",
        };
      }
    } catch (err) {
      console.warn("[Hugging Face] Inference failed:", err);
    }
  }

  return createFallbackPanelImageResponse(
    input,
    "Image backend/Gemini/HuggingFace is not configured or failed.",
  );
}

function createFallbackPanelImageResponse(
  input: GeneratePanelRequest,
  warning: string,
): GeneratePanelResponse {
  return {
    panelId: input.panel.id,
    imageUrl: createCachedPanelImage(input.panel),
    source: "fallback",
    warning,
  };
}

function createImagePrompt({ panel, characters }: GeneratePanelRequest) {
  const characterContext = panel.characterIds
    .map((characterId) =>
      characters.find(
        (character) =>
          character.id === characterId ||
          slugifyCharacterName(character.name) === characterId,
      ),
    )
    .filter(isDefined)
    .map((character) => `${character.name}: ${character.description}`)
    .join("\n");

  const resolvedStyle =
    panel.style && panel.style !== "inherit" ? panel.style : "webtoon";
  const styleModifier =
    COMIC_STYLE_MODIFIERS[
      resolvedStyle as keyof typeof COMIC_STYLE_MODIFIERS
    ] || COMIC_STYLE_MODIFIERS.webtoon;

  return [
    "Create a clean comic panel illustration.",
    `Style: ${styleModifier}`,
    `Scene: ${panel.scenePrompt}`,
    `Dialogue context: ${panel.dialogue}`,
    characterContext ? `Characters:\n${characterContext}` : "",
    `Seed: ${panel.seed}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

async function uploadToSupabaseStorage(
  panelId: string,
  seed: number,
  imageUrl: string,
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
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
