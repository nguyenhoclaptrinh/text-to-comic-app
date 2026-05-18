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
