/**
 * @file image-generation.ts
 * @description Server-side image generation adapter with cached fallback.
 */

import { createCachedPanelImage } from "@/lib/studio/cached-images";
import type {
  GeneratePanelRequest,
  GeneratePanelResponse,
} from "@/lib/studio/api-contracts";

export async function generatePanelImageFromProvider(
  input: GeneratePanelRequest,
): Promise<GeneratePanelResponse> {
  const response = await generateRawPanelImage(input);
  const cloudUrl = await uploadToSupabaseStorage(
    input.panel.id,
    input.panel.seed,
    response.imageUrl,
  );

  return {
    ...response,
    imageUrl: cloudUrl,
    source: cloudUrl.startsWith("http") && !cloudUrl.startsWith("data:") ? "image-backend" : response.source,
  };
}

async function generateRawPanelImage(
  input: GeneratePanelRequest,
): Promise<GeneratePanelResponse> {
  if (input.panel.scenePrompt.toLowerCase().includes("[offline]")) {
    throw new Error("Image backend is offline.");
  }

  const endpoint = process.env.IMAGE_BACKEND_URL;
  if (!endpoint) {
    return createFallbackPanelImageResponse(
      input,
      "Image backend is not configured.",
    );
  }

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

    if (!response.ok) {
      return createFallbackPanelImageResponse(
        input,
        `Image backend returned status ${response.status}.`,
      );
    }

    const data: unknown = await response.json();
    if (isRecord(data) && typeof data.imageUrl === "string") {
      return {
        panelId: input.panel.id,
        imageUrl: data.imageUrl,
        source: "image-backend",
      };
    }

    return createFallbackPanelImageResponse(
      input,
      "Image backend response did not include imageUrl.",
    );
  } catch {
    return createFallbackPanelImageResponse(
      input,
      "Image backend request failed.",
    );
  }
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
      characters.find((character) => character.id === characterId),
    )
    .filter(isDefined)
    .map((character) => `${character.name}: ${character.description}`)
    .join("\n");

  return [
    "Create a clean comic panel illustration.",
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
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
