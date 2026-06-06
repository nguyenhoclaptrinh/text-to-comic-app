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
import { toUserFacingError } from "@/lib/studio/user-facing-errors";
import { createMockPanels, sleep } from "@/lib/studio/utils";
import type { Character, Page, Panel } from "@/lib/studio/types";

export enum StudioAiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AI_TEXT_UNAVAILABLE = "AI_TEXT_UNAVAILABLE",
  AI_IMAGE_OFFLINE = "AI_IMAGE_OFFLINE",
  AI_IMAGE_INVALID_RESPONSE = "AI_IMAGE_INVALID_RESPONSE",
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

export async function analyzeStoryToPages({
  storyTitle,
  storyText,
}: {
  storyTitle: string;
  storyText: string;
}): Promise<Page[]> {
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
    const geminiKey =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("text-to-comic:gemini-key") || ""
        : "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (geminiKey) {
      headers["x-gemini-api-key"] = geminiKey;
    }

    const response = await fetch("/api/storyboard", {
      method: "POST",
      headers,
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
      return parsedResponse.data.pages;
    }

    return createFallbackStoryboardResponse(parsedRequest.data.storyText).pages;
  }

  await sleep(420);
  const panels = createMockPanels(parsedRequest.data.storyText);
  return [
    {
      id: `page-${Date.now()}-1`,
      projectId: `project-${Date.now()}`,
      orderIndex: 1,
      title: "Page 1",
      panels,
    },
  ];
}

export async function generatePanelImage(
  panel: Panel,
  characters: Character[] = [],
): Promise<Partial<Panel>> {
  if (panel.scenePrompt.toLowerCase().includes("[offline]")) {
    throw new StudioAiError(
      StudioAiErrorCode.AI_IMAGE_OFFLINE,
      "Image backend offline. Restart Colab or retry later.",
    );
  }

  if (typeof window !== "undefined") {
    const hfToken =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("text-to-comic:huggingface-token") || ""
        : "";
    const geminiKey =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("text-to-comic:gemini-key") || ""
        : "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (hfToken) {
      headers["x-huggingface-token"] = hfToken;
    }
    if (geminiKey) {
      headers["x-gemini-api-key"] = geminiKey;
    }

    const response = await fetch("/api/generate-panel", {
      method: "POST",
      headers,
      body: JSON.stringify({ panel, characters }),
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new StudioAiError(
        StudioAiErrorCode.AI_IMAGE_OFFLINE,
        getApiErrorMessage(body, "Image backend offline. Retry later."),
      );
    }

    const parsedResponse = GeneratePanelResponseSchema.safeParse(body);
    if (!parsedResponse.success) {
      throw new StudioAiError(
        StudioAiErrorCode.AI_IMAGE_INVALID_RESPONSE,
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
          : panel.dialogue.trim()
            ? [createGeneratedBubble(panel)]
            : [],
    };
  }

  await sleep(GENERATION_DELAY_MS);

  return {
    status: "success",
    errorMessage: undefined,
    bubbles:
      panel.bubbles.length > 0
        ? panel.bubbles
        : panel.dialogue.trim()
          ? [createGeneratedBubble(panel)]
          : [],
  };
}

export function getStudioAiErrorMessage(error: unknown) {
  if (error instanceof StudioAiError) {
    return toUserFacingError(error).message;
  }

  return toUserFacingError(error).message;
}

function getApiErrorMessage(body: unknown, fallback: string) {
  return isRecord(body) && typeof body.message === "string"
    ? body.message
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
