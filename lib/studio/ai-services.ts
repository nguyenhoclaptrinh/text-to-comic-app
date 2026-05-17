/**
 * @file ai-services.ts
 * @description Typed mock AI services for storyboard analysis and panel generation.
 */

import { GENERATION_DELAY_MS } from "@/lib/studio/constants";
import { createGeneratedBubble } from "@/lib/studio/factories";
import { createMockPanels, sleep } from "@/lib/studio/utils";
import type { Panel } from "@/lib/studio/types";

export enum StudioAiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
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
  if (!storyTitle.trim() || !storyText.trim()) {
    throw new StudioAiError(
      StudioAiErrorCode.VALIDATION_ERROR,
      "Title and story text are required.",
    );
  }

  await sleep(420);
  return createMockPanels(storyText);
}

export async function generatePanelImage(
  panel: Panel,
): Promise<Partial<Panel>> {
  if (panel.scenePrompt.toLowerCase().includes("[offline]")) {
    throw new StudioAiError(
      StudioAiErrorCode.IMAGE_BACKEND_OFFLINE,
      "Image backend offline. Restart Colab or retry later.",
    );
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
