/**
 * @file studio-ai-services.test.ts
 * @description Unit tests for typed mock AI service contracts.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  analyzeStoryToPages,
  generatePanelImage,
  generatePanelImageWithKaggleFallback,
  generatePanelImageViaKaggleJob,
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
      analyzeStoryToPages({ storyTitle: "", storyText: "" }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.VALIDATION_ERROR,
      message: "Title and story text are required.",
    });
  });

  it("should create mock storyboard pages from valid story text", async () => {
    vi.useFakeTimers();
    const promise = analyzeStoryToPages({
      storyTitle: "Snow Road Inn",
      storyText: SAMPLE_STORY,
    });

    await vi.runAllTimersAsync();

    const { pages } = await promise;
    expect(pages).toHaveLength(1);
    expect(pages[0].panels).toHaveLength(3);
    vi.useRealTimers();
  });

  it("should load storyboard pages through the browser API adapter", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          source: "gemini",
          pages: [
            {
              id: "page-1",
              projectId: "project-1",
              orderIndex: 1,
              title: "Page 1",
              panels: PANELS_SEED.map((panel) => ({
                ...panel,
                status: "draft",
              })),
            },
          ],
          characters: [
            {
              id: "xiao-se",
              name: "Xiao Se",
              role: "Vai chính",
              gender: "Nam",
              description: "Mô tả",
              color: "#8b5cf6",
            },
          ],
        }),
      }),
    );

    const { pages, characters } = await analyzeStoryToPages({
      storyTitle: "Snow Road Inn",
      storyText: SAMPLE_STORY,
    });
    expect(pages).toHaveLength(1);
    expect(pages[0].panels).toHaveLength(3);
    expect(characters).toHaveLength(1);
    expect(characters?.[0].name).toBe("Xiao Se");
  });

  it("should reject when the browser storyboard API returns an invalid body", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: true }),
      }),
    );

    await expect(
      analyzeStoryToPages({
        storyTitle: "Snow Road Inn",
        storyText: SAMPLE_STORY,
      }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_TEXT_UNAVAILABLE,
      message: "Storyboard backend returned an invalid response.",
    });
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
      analyzeStoryToPages({
        storyTitle: "Snow Road Inn",
        storyText: SAMPLE_STORY,
      }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_TEXT_UNAVAILABLE,
      message: "Gemini quota exceeded.",
    });
  });

  it("should preserve existing bubbles without auto-generating new ones", async () => {
    vi.useFakeTimers();
    const promise = generatePanelImage({ ...PANELS_SEED[1], bubbles: [] });

    await vi.runAllTimersAsync();
    const patch = await promise;

    expect(patch).toMatchObject({ status: "success" });
    expect(patch.bubbles).toHaveLength(0);
    expect(patch.imageUrl).toBeUndefined();
    vi.useRealTimers();
  });

  it("should create a successful panel generation patch with no bubbles if dialogue is empty", async () => {
    vi.useFakeTimers();
    const promise = generatePanelImage({
      ...PANELS_SEED[1],
      dialogue: "",
      bubbles: [],
    });

    await vi.runAllTimersAsync();
    const patch = await promise;

    expect(patch).toMatchObject({ status: "success" });
    expect(patch.bubbles).toHaveLength(0);
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
          usedProvider: "fallback",
        }),
      }),
    );

    await expect(generatePanelImage(PANELS_SEED[0])).resolves.toMatchObject({
      status: "success",
      imageUrl: expect.stringMatching(/^data:image/),
      errorMessage: "Image backend is not configured.",
      usedProvider: "fallback",
    });
  });

  it("should use Hugging Face panel generation before Kaggle fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        panelId: PANELS_SEED[0].id,
        imageUrl: "data:image/png;base64,aGY=",
        source: "image-backend",
        usedProvider: "huggingface",
        usedModel: "black-forest-labs/FLUX.1-schnell",
      }),
    });

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generatePanelImageWithKaggleFallback(PANELS_SEED[0], [], true),
    ).resolves.toMatchObject({
      status: "success",
      usedProvider: "huggingface",
      usedModel: "black-forest-labs/FLUX.1-schnell",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-panel",
      expect.any(Object),
    );
  });

  it("should fall back to Kaggle when Hugging Face and Imagen generation fail", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Image providers unavailable." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-fallback",
          panelId: PANELS_SEED[0].id,
          status: "queued",
          usedProvider: "kaggle",
          usedModel: "Meina/MeinaMix_V11",
          retryAfterMs: 2000,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-fallback",
          panelId: PANELS_SEED[0].id,
          status: "succeeded",
          imageUrl: "https://example.test/kaggle-panel.png",
          usedProvider: "kaggle",
          usedModel: "Meina/MeinaMix_V11",
        }),
      });

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = generatePanelImageWithKaggleFallback(
      PANELS_SEED[0],
      [],
      true,
    );
    await vi.advanceTimersByTimeAsync(6000);

    await expect(promise).resolves.toMatchObject({
      status: "success",
      imageUrl: "https://example.test/kaggle-panel.png",
      usedProvider: "kaggle",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/generate-panel",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/kaggle-panel-jobs",
      expect.any(Object),
    );
    vi.useRealTimers();
  });

  it("should forward local API tokens to browser image generation requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        panelId: PANELS_SEED[0].id,
        imageUrl: "data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E",
        source: "fallback",
      }),
    });

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        key.includes("huggingface") ? "hf-token" : "gemini-key",
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generatePanelImage(PANELS_SEED[0]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-panel",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-huggingface-token": "hf-token",
          "x-gemini-api-key": "gemini-key",
        }),
      }),
    );
  });

  it("should poll Kaggle image jobs and return a successful panel patch", async () => {
    vi.useFakeTimers();
    const statuses: string[] = [];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-1",
          panelId: PANELS_SEED[0].id,
          status: "queued",
          usedProvider: "kaggle",
          usedModel: "user/comic-panel-generator",
          retryAfterMs: 2000,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-1",
          panelId: PANELS_SEED[0].id,
          status: "running",
          usedProvider: "kaggle",
          usedModel: "user/comic-panel-generator",
          retryAfterMs: 2000,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-1",
          panelId: PANELS_SEED[0].id,
          status: "succeeded",
          imageUrl: "https://example.test/panel.png",
          usedProvider: "kaggle",
          usedModel: "user/comic-panel-generator",
        }),
      });

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = generatePanelImageViaKaggleJob(
      PANELS_SEED[0],
      [],
      (status) => statuses.push(status),
    );
    await vi.advanceTimersByTimeAsync(7000);

    await expect(promise).resolves.toMatchObject({
      status: "success",
      imageUrl: "https://example.test/panel.png",
      usedProvider: "kaggle",
    });
    expect(statuses).toEqual(["queued", "generating"]);
    vi.useRealTimers();
  });

  it("should surface Kaggle startup failures without silent fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Kaggle disabled." }),
    });

    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generatePanelImageViaKaggleJob(PANELS_SEED[0]),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_IMAGE_OFFLINE,
      message: "Kaggle disabled.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should keep polling long-running Kaggle jobs before falling back", async () => {
    vi.useFakeTimers();
    const runningResponse = {
      ok: true,
      json: async () => ({
        jobId: "job-long",
        panelId: PANELS_SEED[0].id,
        status: "running",
        usedProvider: "kaggle",
        usedModel: "Meina/MeinaMix_V11",
        retryAfterMs: 5000,
      }),
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-long",
          panelId: PANELS_SEED[0].id,
          status: "queued",
          usedProvider: "kaggle",
          usedModel: "Meina/MeinaMix_V11",
          retryAfterMs: 5000,
        }),
      })
      .mockResolvedValueOnce(runningResponse)
      .mockResolvedValueOnce(runningResponse)
      .mockResolvedValueOnce(runningResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-long",
          panelId: PANELS_SEED[0].id,
          status: "succeeded",
          imageUrl: "https://example.test/kaggle-panel.png",
          usedProvider: "kaggle",
          usedModel: "Meina/MeinaMix_V11",
        }),
      });

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = generatePanelImageViaKaggleJob(PANELS_SEED[0]);
    await vi.advanceTimersByTimeAsync(20_000);

    await expect(promise).resolves.toMatchObject({
      status: "success",
      imageUrl: "https://example.test/kaggle-panel.png",
      usedModel: "Meina/MeinaMix_V11",
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/generate-panel",
      expect.any(Object),
    );
    vi.useRealTimers();
  });

  it("should surface failed Kaggle jobs without silent fallback", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-failed",
          panelId: PANELS_SEED[0].id,
          status: "queued",
          usedProvider: "kaggle",
          usedModel: "Meina/MeinaMix_V11",
          retryAfterMs: 5000,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-failed",
          panelId: PANELS_SEED[0].id,
          status: "failed",
          errorMessage: "Kaggle kernel failed.",
          usedProvider: "kaggle",
          usedModel: "Meina/MeinaMix_V11",
        }),
      });

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = expect(
      generatePanelImageViaKaggleJob(PANELS_SEED[0]),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_IMAGE_OFFLINE,
      message: "Kaggle kernel failed.",
    });
    await vi.advanceTimersByTimeAsync(5000);

    await promise;
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/generate-panel",
      expect.any(Object),
    );
    vi.useRealTimers();
  });

  it("should map browser image API failures without raw provider messages", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ invalid: true }),
      }),
    );

    await expect(generatePanelImage(PANELS_SEED[0])).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_IMAGE_OFFLINE,
      message: "Image backend offline. Retry later.",
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
      code: StudioAiErrorCode.AI_IMAGE_INVALID_RESPONSE,
    });
  });

  it("should return a typed error when the mock image backend is offline", async () => {
    await expect(
      generatePanelImage({
        ...PANELS_SEED[0],
        scenePrompt: "[offline] test prompt",
      }),
    ).rejects.toMatchObject({
      code: StudioAiErrorCode.AI_IMAGE_OFFLINE,
    });
  });

  it("should map typed and unknown errors to user-facing copy", () => {
    expect(
      getStudioAiErrorMessage(
        new StudioAiError(StudioAiErrorCode.AI_IMAGE_OFFLINE, "Offline"),
      ),
    ).toBe(
      "Dịch vụ vẽ ảnh chưa sẵn sàng. Khung truyện vẫn được lưu, bạn có thể thử vẽ lại sau.",
    );
    expect(getStudioAiErrorMessage(new Error("Unexpected"))).toBe(
      "Có lỗi ngoài dự kiến. Dữ liệu đã nhập vẫn được giữ để bạn thử lại.",
    );
  });
});
