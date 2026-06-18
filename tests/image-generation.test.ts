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
        body: expect.stringContaining('"size":"1024x1024"'),
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
        ok: false,
        status: 503,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"error":"fallback model loading"}',
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        body: expect.stringContaining('"model":"black-forest-labs/FLUX.1-schnell"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        body: expect.stringContaining('"model":"stabilityai/stable-diffusion-3-medium-diffusers"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=gemini-api-key",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"aspectRatio":"3:4"'),
      }),
    );
  });

  it("should fall back to HF manga/anime model when default HF model fails for manga style", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"error":"rate limit"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          data: [{ b64_json: "bWFuZ2EtZmFsbGJhY2s=" }],
        }),
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePanelImageFromProvider(
      {
        panel: { ...PANELS_SEED[0], style: "manga" },
        characters: [],
      },
      "hf-token",
      undefined,
    );

    expect(result).toMatchObject({
      imageUrl: "data:image/png;base64,bWFuZ2EtZmFsbGJhY2s=",
      source: "image-backend",
      usedProvider: "huggingface",
      usedModel: "stabilityai/stable-diffusion-3-medium-diffusers",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        body: expect.stringContaining('"model":"black-forest-labs/FLUX.1-schnell"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        body: expect.stringContaining('"model":"stabilityai/stable-diffusion-3-medium-diffusers"'),
      }),
    );
  });

  it("should fall back to HF comic/general model when default HF model fails for western style", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"error":"rate limit"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          data: [{ b64_json: "Y29taWMtZmFsbGJhY2s=" }],
        }),
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generatePanelImageFromProvider(
      {
        panel: { ...PANELS_SEED[0], style: "western" },
        characters: [],
      },
      "hf-token",
      undefined,
    );

    expect(result).toMatchObject({
      imageUrl: "data:image/png;base64,Y29taWMtZmFsbGJhY2s=",
      source: "image-backend",
      usedProvider: "huggingface",
      usedModel: "stabilityai/stable-diffusion-3-medium-diffusers",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        body: expect.stringContaining('"model":"black-forest-labs/FLUX.1-schnell"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://router.huggingface.co/nscale/v1/images/generations",
      expect.objectContaining({
        body: expect.stringContaining('"model":"stabilityai/stable-diffusion-3-medium-diffusers"'),
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

  it("should fail instead of returning a mock image when demo fallback is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("IMAGE_BACKEND_URL", "");
    vi.stubEnv("AI_DEMO_FALLBACK_ENABLED", "false");

    await expect(
      generatePanelImageFromProvider({
        panel: PANELS_SEED[0],
        characters: [],
      }),
    ).rejects.toThrow(
      "HuggingFace/Imagen/Image backend is not configured or failed.",
    );
  });
});
