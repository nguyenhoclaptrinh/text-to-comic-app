/**
 * @file suggest-story-route.test.ts
 * @description API route tests for story suggestion error mapping.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { AiProviderError } from "@/lib/server/ai-router";
import { POST } from "@/app/api/suggest-story/route";
import { generateStorySuggestion } from "@/lib/server/gemini-storyboard";

vi.mock("@/lib/server/gemini-storyboard", () => ({
  generateStorySuggestion: vi.fn(),
}));

describe("suggest-story route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should preserve provider timeout status for retryable failures", async () => {
    vi.mocked(generateStorySuggestion).mockRejectedValueOnce(
      new AiProviderError("AI request timed out.", 408, "TIMEOUT"),
    );

    const response = await POST(
      new Request("http://localhost/api/suggest-story", {
        method: "POST",
        body: JSON.stringify({
          title: "Seminar demo",
          style: "webtoon",
          genre: "slice of life",
          aspectRatio: "1:1",
        }),
      }),
    );

    expect(response.status).toBe(408);
    await expect(response.json()).resolves.toMatchObject({
      code: "AI_TEXT_UNAVAILABLE",
      message: "AI request timed out.",
      retryable: true,
    });
  });

  it("should map provider quota errors to AI_TEXT_QUOTA", async () => {
    vi.mocked(generateStorySuggestion).mockRejectedValueOnce(
      new AiProviderError("quota exceeded", 429),
    );

    const response = await POST(
      new Request("http://localhost/api/suggest-story", {
        method: "POST",
        body: JSON.stringify({
          title: "Seminar demo",
          style: "webtoon",
          genre: "slice of life",
          aspectRatio: "1:1",
        }),
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      code: "AI_TEXT_QUOTA",
      retryable: true,
    });
  });
});
