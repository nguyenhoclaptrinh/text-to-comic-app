/**
 * @file server-ai-router.test.ts
 * @description Unit tests for server-side AI model routing.
 */

import { describe, expect, it, vi } from "vitest";

import {
  AiProviderError,
  createModelCandidates,
  parseModelList,
  routeAiModels,
} from "@/lib/server/ai-router";

describe("server AI router", () => {
  it("should choose enabled models by priority order", async () => {
    const run = vi.fn().mockResolvedValue("ok");
    const result = await routeAiModels({
      candidates: [
        {
          provider: "gemini",
          model: "slow",
          capability: "storyboard",
          priority: 2,
          stable: true,
          enabled: true,
        },
        {
          provider: "gemini",
          model: "fast",
          capability: "storyboard",
          priority: 1,
          stable: true,
          enabled: true,
        },
      ],
      run,
    });

    expect(result).toMatchObject({ ok: true, model: "fast", value: "ok" });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("should skip disabled models", async () => {
    const run = vi.fn().mockResolvedValue("ok");
    const result = await routeAiModels({
      candidates: [
        {
          provider: "gemini",
          model: "disabled",
          capability: "storyboard",
          priority: 1,
          stable: true,
          enabled: false,
        },
        {
          provider: "gemini",
          model: "enabled",
          capability: "storyboard",
          priority: 2,
          stable: true,
          enabled: true,
        },
      ],
      run,
    });

    expect(result).toMatchObject({ ok: true, model: "enabled" });
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({ model: "enabled" }),
    );
  });

  it("should rotate on retryable provider statuses", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new AiProviderError("quota", 429))
      .mockRejectedValueOnce(new AiProviderError("unavailable", 503))
      .mockResolvedValueOnce("recovered");

    const result = await routeAiModels({
      candidates: createModelCandidates({
        provider: "gemini",
        capability: "storyboard",
        models: ["m1", "m2", "m3"],
      }),
      run,
    });

    expect(result).toMatchObject({
      ok: true,
      model: "m3",
      value: "recovered",
    });
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("should stop on auth and validation errors", async () => {
    const authRun = vi
      .fn()
      .mockRejectedValue(new AiProviderError("forbidden", 403));
    const authResult = await routeAiModels({
      candidates: createModelCandidates({
        provider: "gemini",
        capability: "storyboard",
        models: ["m1", "m2"],
      }),
      run: authRun,
    });

    const validationRun = vi
      .fn()
      .mockRejectedValue(new AiProviderError("bad payload", 400));
    const validationResult = await routeAiModels({
      candidates: createModelCandidates({
        provider: "gemini",
        capability: "storyboard",
        models: ["m1", "m2"],
      }),
      run: validationRun,
    });

    expect(authResult).toMatchObject({ ok: false, model: "m1" });
    expect(validationResult).toMatchObject({ ok: false, model: "m1" });
    expect(authRun).toHaveBeenCalledTimes(1);
    expect(validationRun).toHaveBeenCalledTimes(1);
  });

  it("should parse model env lists with trimming and dedupe", () => {
    expect(parseModelList(" a, b ,,a , c ", ["fallback"])).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(parseModelList("", ["fallback", "fallback", "second"])).toEqual([
      "fallback",
      "second",
    ]);
  });
});
