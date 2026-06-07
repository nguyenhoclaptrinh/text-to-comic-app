/**
 * @file studio-production-config.test.ts
 * @description Unit tests for production/provider status helpers.
 */

import { describe, expect, it } from "vitest";

import {
  getDefaultAiModelPools,
  getLastAiRoute,
  getProviderStatuses,
} from "@/lib/studio/production-config";

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

  it("should expose default AI model pools for Settings", () => {
    expect(getDefaultAiModelPools()).toEqual([
      {
        label: "Phân tích truyện",
        models: [
          "gemini-3.5-flash",
          "gemini-3.1-flash-lite",
          "gemini-2.5-flash",
          "gemini-2.5-flash-lite",
        ],
      },
      {
        label: "Vẽ ảnh Gemini",
        models: [
          "gemini-3.1-flash-image",
          "gemini-2.5-flash-image",
          "gemini-2.5-flash",
        ],
      },
      {
        label: "Ảnh Hugging Face",
        models: ["black-forest-labs/FLUX.1-dev:fastest"],
      },
    ]);
  });

  it("should read the last AI route from browser storage", () => {
    const storage = {
      getItem: (key: string) =>
        key.endsWith("provider") ? "gemini" : "gemini-3.5-flash",
    };

    expect(getLastAiRoute(storage, "text")).toEqual({
      provider: "gemini",
      model: "gemini-3.5-flash",
    });
    expect(getLastAiRoute(undefined, "image")).toEqual({
      provider: "",
      model: "",
    });
  });
});
