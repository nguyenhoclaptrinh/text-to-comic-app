/**
 * @file kaggle-image-jobs.test.ts
 * @description Unit tests for Kaggle image job configuration and mapping.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getKagglePanelJob,
  KaggleImageJobError,
} from "@/lib/server/kaggle-image-jobs";

describe("Kaggle image jobs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("should require Supabase configuration for job reads", async () => {
    await expect(getKagglePanelJob("job-1")).rejects.toBeInstanceOf(
      KaggleImageJobError,
    );
  });

  it("should map Supabase job rows to safe client responses", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.example.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "job-1",
            panel_id: "panel-1",
            status: "succeeded",
            prompt: "secret prompt",
            result_image_url: "https://example.test/panel.png",
            error_message: null,
            provider: "kaggle",
            model: "user/comic-panel-generator",
          },
        ],
      }),
    );

    await expect(getKagglePanelJob("job-1")).resolves.toEqual({
      jobId: "job-1",
      panelId: "panel-1",
      status: "succeeded",
      imageUrl: "https://example.test/panel.png",
      errorMessage: undefined,
      usedModel: "user/comic-panel-generator",
      usedProvider: "kaggle",
      retryAfterMs: 5000,
    });
  });
});
