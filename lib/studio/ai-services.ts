/**
 * @file ai-services.ts
 * @description Client-side AI service adapters with server API and fallback support.
 */

import { GENERATION_DELAY_MS } from "@/lib/studio/constants";
import { createGeneratedBubble } from "@/lib/studio/factories";
import { createFallbackStoryboardResponse } from "@/lib/studio/storyboard";
import {
  GeneratePanelResponseSchema,
  StoryboardRequestSchema,
  StoryboardResponseSchema,
} from "@/lib/studio/api-contracts";
import { createMockPanels, sleep } from "@/lib/studio/utils";
import type { Character, Panel } from "@/lib/studio/types";

export enum StudioAiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AI_TEXT_UNAVAILABLE = "AI_TEXT_UNAVAILABLE",
  IMAGE_BACKEND_OFFLINE = "IMAGE_BACKEND_OFFLINE",
}

export class StudioAiError extends Error {
  constructor(
    readonly code: StudioAiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StudioAiError";
  }
}

export async function analyzeStoryToPanels({
  storyTitle,
  storyText,
}: {
  storyTitle: string;
  storyText: string;
}) {
  const parsedRequest = StoryboardRequestSchema.safeParse({
    storyTitle,
    storyText,
  });

  if (!parsedRequest.success) {
    throw new StudioAiError(
      StudioAiErrorCode.VALIDATION_ERROR,
      "Title and story text are required.",
    );
  }

  if (typeof window !== "undefined") {
    const response = await fetch("/api/storyboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedRequest.data),
    });

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new StudioAiError(
        StudioAiErrorCode.AI_TEXT_UNAVAILABLE,
        getApiErrorMessage(body, "Storyboard generation failed."),
      );
    }

    const parsedResponse = StoryboardResponseSchema.safeParse(body);
    if (parsedResponse.success) {
      return parsedResponse.data.panels;
    }

    return createFallbackStoryboardResponse(parsedRequest.data.storyText)
      .panels;
  }

  await sleep(420);
  return createMockPanels(parsedRequest.data.storyText);
}

export async function generatePanelImage(
  panel: Panel,
  characters: Character[] = [],
): Promise<Partial<Panel>> {
  if (panel.scenePrompt.toLowerCase().includes("[offline]")) {
    throw new StudioAiError(
      StudioAiErrorCode.IMAGE_BACKEND_OFFLINE,
      "Image backend offline. Restart Colab or retry later.",
    );
  }

  if (typeof window !== "undefined") {
    const response = await fetch("/api/generate-panel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panel, characters }),
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new StudioAiError(
        StudioAiErrorCode.IMAGE_BACKEND_OFFLINE,
        getApiErrorMessage(body, "Image backend offline. Retry later."),
      );
    }

    const parsedResponse = GeneratePanelResponseSchema.safeParse(body);
    if (!parsedResponse.success) {
      throw new StudioAiError(
        StudioAiErrorCode.IMAGE_BACKEND_OFFLINE,
        "Image backend returned an invalid response.",
      );
    }

    return {
      status: "success",
      imageUrl: parsedResponse.data.imageUrl,
      errorMessage: parsedResponse.data.warning,
      bubbles:
        panel.bubbles.length > 0
          ? panel.bubbles
          : [createGeneratedBubble(panel)],
    };
  }

  await sleep(GENERATION_DELAY_MS);

  return {
    status: "success",
    errorMessage: undefined,
    bubbles:
      panel.bubbles.length > 0 ? panel.bubbles : [createGeneratedBubble(panel)],
  };
}

export function getStudioAiErrorMessage(error: unknown) {
  if (error instanceof StudioAiError) {
    return error.message;
  }

  return "The AI service failed unexpectedly. Please retry.";
}

function getApiErrorMessage(body: unknown, fallback: string) {
  return isRecord(body) && typeof body.message === "string"
    ? body.message
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
