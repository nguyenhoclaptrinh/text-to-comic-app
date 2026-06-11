/**
 * @file image-generation.test.ts
 * @description Unit tests for server-side image generation provider routing.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { generatePanelImageFromProvider } from "@/lib/server/image-generation";
import { PANELS_SEED } from "@/lib/studio/mock-data";

describe("server image generation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("should call Hugging Face before Imagen when an HF token is available", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        data: [{ b64_json: "aGYtaW1hZ2U=" }],
      }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePanelImageFromProvider(
      {
        panel: PANELS_SEED[0],
        characters: [],
      },
      "hf-token",
      "gemini-api-key",
    );

    expect(result).toMatchObject({
      panelId: PANELS_SEED[0].id,
      imageUrl: "data:image/png;base64,aGYtaW1hZ2U=",
      source: "image-backend",
      usedProvider: "huggingface",
      usedModel: "black-forest-labs/FLUX.1-schnell",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer hf-token",
        }),
        body: expect.stringContaining(
          '"model":"black-forest-labs/FLUX.1-schnell"',
        ),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"num_inference_steps":8'),
      }),
    );
  });

  it("should fall back to Imagen when Hugging Face fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("IMAGEN_IMAGE_MODELS", "imagen-4.0-generate-001");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"error":"model loading"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          predictions: [
            {
              bytesBase64Encoded: "aW1hZ2Vu",
              mimeType: "image/png",
            },
          ],
        }),
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePanelImageFromProvider(
      {
        panel: PANELS_SEED[0],
        characters: [],
      },
      "hf-token",
      "gemini-api-key",
    );

    expect(result).toMatchObject({
      panelId: PANELS_SEED[0].id,
      imageUrl: "data:image/png;base64,aW1hZ2Vu",
      source: "image-backend",
      usedProvider: "imagen",
      usedModel: "imagen-4.0-generate-001",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=gemini-api-key",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"aspectRatio":"3:4"'),
      }),
    );
  });

  it("should not treat Hugging Face JSON errors as image data", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "quota exceeded" }),
      text: async () => '{"error":"quota exceeded"}',
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePanelImageFromProvider(
      {
        panel: PANELS_SEED[0],
        characters: [],
      },
      "hf-token",
      undefined,
    );

    expect(result).toMatchObject({
      source: "fallback",
      usedProvider: "fallback",
    });
    expect(result.imageUrl).toMatch(/^data:image\/svg\+xml/);
  });

  it("should skip Hugging Face when no HF token is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "");
    vi.stubEnv("IMAGEN_IMAGE_MODELS", "imagen-4.0-generate-001");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        predictions: [
          {
            bytesBase64Encoded: "aW1hZ2Vu",
            mimeType: "image/png",
          },
        ],
      }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePanelImageFromProvider(
      {
        panel: PANELS_SEED[0],
        characters: [],
      },
      undefined,
      "gemini-api-key",
    );

    expect(result.usedProvider).toBe("imagen");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "generativelanguage.googleapis.com",
    );
  });
});
