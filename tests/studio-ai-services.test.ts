/**
 * @file studio-ai-services.test.ts
 * @description Unit tests for typed mock AI service contracts.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  analyzeStoryToPanels,
  generatePanelImage,
  getStudioAiErrorMessage,
  StudioAiError,
  StudioAiErrorCode,
} from "@/lib/studio/ai-services";
import { PANELS_SEED, SAMPLE_STORY } from "@/lib/studio/mock-data";

describe("studio AI services", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("should load storyboard panels through the browser API adapter", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          source: "gemini",
          panels: PANELS_SEED.map((panel) => ({ ...panel, status: "draft" })),
        }),
      }),
    );

    await expect(
      analyzeStoryToPanels({
        storyTitle: "Snow Road Inn",
        storyText: SAMPLE_STORY,
      }),
    ).resolves.toHaveLength(3);
  });

  it("should fall back when the browser storyboard API returns an invalid body", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: true }),
      }),
    );

    const panels = await analyzeStoryToPanels({
      storyTitle: "Snow Road Inn",
      storyText: SAMPLE_STORY,
    });

    expect(panels).toHaveLength(3);
    expect(panels[0].id).toMatch(/^panel-/);
  });

  it("should map browser storyboard API failures to typed errors", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Gemini quota exceeded." }),
      }),
    );

    await expect(
      analyzeStoryToPanels({
        storyTitle: "Snow Road Inn",
        storyText: SAMPLE_STORY,
      }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_TEXT_UNAVAILABLE,
      message: "Gemini quota exceeded.",
    });
  });

  it("should create a successful panel generation patch with a bubble fallback", async () => {
    vi.useFakeTimers();
    const promise = generatePanelImage({ ...PANELS_SEED[1], bubbles: [] });

    await vi.runAllTimersAsync();
    const patch = await promise;

    expect(patch).toMatchObject({ status: "success" });
    expect(patch.bubbles).toHaveLength(1);
    expect(patch.imageUrl).toBeUndefined();
    vi.useRealTimers();
  });

  it("should load generated panel images through the browser API adapter", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          panelId: PANELS_SEED[0].id,
          imageUrl: "data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E",
          source: "fallback",
          warning: "Image backend is not configured.",
        }),
      }),
    );

    await expect(generatePanelImage(PANELS_SEED[0])).resolves.toMatchObject({
      status: "success",
      imageUrl: expect.stringMatching(/^data:image/),
      errorMessage: "Image backend is not configured.",
    });
  });

  it("should reject invalid browser image API responses", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ imageUrl: "" }),
      }),
    );

    await expect(generatePanelImage(PANELS_SEED[0])).rejects.toMatchObject({
      code: StudioAiErrorCode.IMAGE_BACKEND_OFFLINE,
    });
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
