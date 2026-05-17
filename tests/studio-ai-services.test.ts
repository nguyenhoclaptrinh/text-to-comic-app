/**
 * @file studio-ai-services.test.ts
 * @description Unit tests for typed mock AI service contracts.
 */

import { describe, expect, it, vi } from "vitest";

import {
  analyzeStoryToPanels,
  generatePanelImage,
  getStudioAiErrorMessage,
  StudioAiError,
  StudioAiErrorCode,
} from "@/lib/studio/ai-services";
import { PANELS_SEED, SAMPLE_STORY } from "@/lib/studio/mock-data";

describe("studio AI services", () => {
  it("should reject empty storyboard input with a typed validation error", async () => {
    await expect(
      analyzeStoryToPanels({ storyTitle: "", storyText: "" }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.VALIDATION_ERROR,
      message: "Title and story text are required.",
    });
  });

  it("should create mock storyboard panels from valid story text", async () => {
    vi.useFakeTimers();
    const promise = analyzeStoryToPanels({
      storyTitle: "Snow Road Inn",
      storyText: SAMPLE_STORY,
    });

    await vi.runAllTimersAsync();

    await expect(promise).resolves.toHaveLength(3);
    vi.useRealTimers();
  });

  it("should create a successful panel generation patch with a bubble fallback", async () => {
    vi.useFakeTimers();
    const promise = generatePanelImage({ ...PANELS_SEED[1], bubbles: [] });

    await vi.runAllTimersAsync();
    const patch = await promise;

    expect(patch).toMatchObject({ status: "success" });
    expect(patch.bubbles).toHaveLength(1);
    vi.useRealTimers();
  });

  it("should return a typed error when the mock image backend is offline", async () => {
    await expect(
      generatePanelImage({
        ...PANELS_SEED[0],
        scenePrompt: "[offline] test prompt",
      }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.IMAGE_BACKEND_OFFLINE,
    });
  });

  it("should map typed and unknown errors to user-facing copy", () => {
    expect(
      getStudioAiErrorMessage(
        new StudioAiError(StudioAiErrorCode.IMAGE_BACKEND_OFFLINE, "Offline"),
      ),
    ).toBe("Offline");
    expect(getStudioAiErrorMessage(new Error("Unexpected"))).toBe(
      "The AI service failed unexpectedly. Please retry.",
    );
  });
});
