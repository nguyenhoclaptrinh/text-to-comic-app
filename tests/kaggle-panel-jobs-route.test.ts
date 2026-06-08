/**
 * @file kaggle-panel-jobs-route.test.ts
 * @description API route tests for starting Kaggle panel jobs.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/kaggle-panel-jobs/route";
import { PANELS_SEED } from "@/lib/studio/mock-data";

describe("Kaggle panel jobs route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should reject invalid panel generation requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/kaggle-panel-jobs", {
        method: "POST",
        body: JSON.stringify({ invalid: true }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      retryable: false,
    });
  });

  it("should return a safe unavailable error when Kaggle is disabled", async () => {
    const response = await POST(
      new Request("http://localhost/api/kaggle-panel-jobs", {
        method: "POST",
        body: JSON.stringify({ panel: PANELS_SEED[0], characters: [] }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "AI_IMAGE_OFFLINE",
      message: "Kaggle image jobs are disabled.",
      retryable: true,
    });
  });
});
