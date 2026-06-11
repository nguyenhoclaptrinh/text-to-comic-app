/**
 * @file ai-health-route.test.ts
 * @description Tests for AI runtime diagnostics route.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/ai/route";

describe("AI health route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report configured AI providers without exposing raw secrets", async () => {
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "fake-hf-secret-token-123456");
    vi.stubEnv("GEMINI_API_KEY", "gemini_secret_123456");
    vi.stubEnv(
      "IMAGE_BACKEND_URL",
      "https://user:pass@example.com/generate?token=secret",
    );
    vi.stubEnv("KAGGLE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_KAGGLE_ENABLED", "true");
    vi.stubEnv("KAGGLE_API_TOKEN", "kaggle_secret_123456");
    vi.stubEnv("KAGGLE_USERNAME", "seminar-user");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "supabase_secret_123456");
    vi.stubEnv("AI_DEMO_FALLBACK_ENABLED", "false");
    vi.stubEnv("AI_DEBUG_LOGS", "true");

    const response = await GET();
    const data = await response.json();
    const serialized = JSON.stringify(data);

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      ok: true,
      routes: {
        storyboard: "/api/storyboard",
        generatePanel: "/api/generate-panel",
        kaggleJobs: "/api/kaggle-panel-jobs",
      },
      fallback: {
        demoFallbackEnabled: false,
        debugAiLoggingEnabled: true,
      },
      providers: {
        huggingFace: {
          configured: true,
          model: "black-forest-labs/FLUX.1-schnell",
          provider: "nscale",
          size: "1024x1024",
        },
        imagen: { configured: true },
        geminiStoryboard: { configured: true },
        imageBackend: {
          configured: true,
          endpoint: "https://example.com/generate",
        },
        kaggle: {
          enabled: true,
          publicEnabled: true,
          configured: true,
        },
        supabase: {
          configured: true,
          url: "https://demo.supabase.co",
        },
      },
    });
    expect(serialized).not.toContain("fake-hf-secret-token-123456");
    expect(serialized).not.toContain("gemini_secret_123456");
    expect(serialized).not.toContain("kaggle_secret_123456");
    expect(serialized).not.toContain("supabase_secret_123456");
    expect(serialized).not.toContain("user:pass");
    expect(serialized).not.toContain("token=secret");
  });
});
