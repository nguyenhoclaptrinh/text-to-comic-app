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

  it("should call Imagen 4 Generate before other image providers", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("IMAGEN_IMAGE_MODELS", "imagen-4.0-generate-001");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        predictions: [
          {
            bytesBase64Encoded: "aW1hZ2Vu",
            mimeType: "image/png",
          },
        ],
      }),
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

    expect(result).toMatchObject({
      panelId: PANELS_SEED[0].id,
      imageUrl: "data:image/png;base64,aW1hZ2Vu",
      source: "image-backend",
      usedProvider: "imagen",
      usedModel: "imagen-4.0-generate-001",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=gemini-api-key",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"aspectRatio":"3:4"'),
      }),
    );
  });
});
