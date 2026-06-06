/**
 * @file studio-production-config.test.ts
 * @description Unit tests for production/provider status helpers.
 */

import { describe, expect, it } from "vitest";

import { getProviderStatuses } from "@/lib/studio/production-config";

describe("studio production config", () => {
  it("should mark provider statuses from browser/local and environment inputs", () => {
    expect(
      getProviderStatuses({
        geminiKey: "gemini",
        huggingFaceToken: "",
        imageBackendUrl: "https://image.example.test",
      }),
    ).toEqual([
      {
        label: "Gemini phân tích truyện",
        configured: true,
        source: "local",
      },
      {
        label: "HuggingFace vẽ ảnh",
        configured: false,
        source: "missing",
      },
      {
        label: "Image backend riêng",
        configured: true,
        source: "environment",
      },
    ]);
  });
});
