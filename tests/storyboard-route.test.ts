/**
 * @file storyboard-route.test.ts
 * @description API route tests for storyboard generation fallback behavior.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/storyboard/route";

describe("storyboard route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("should return an unavailable error when AI fails and demo fallback is disabled", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-api-key");
    vi.stubEnv("GEMINI_TEXT_MODELS", "gemini-test-model");
    vi.stubEnv("AI_DEMO_FALLBACK_ENABLED", "false");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"error":"provider unavailable"}',
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/storyboard", {
        method: "POST",
        body: JSON.stringify({
          storyTitle: "Seminar demo",
          storyText:
            "A hero enters a bright classroom and explains the comic pipeline.",
        }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "AI_TEXT_UNAVAILABLE",
      retryable: true,
    });
  });
});
