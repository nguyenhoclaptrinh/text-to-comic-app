/**
 * @file studio-domain.test.ts
 * @description Unit tests for core studio domain rules.
 */

import { describe, expect, it } from "vitest";

import {
  canTransitionPanelStatus,
  markPanelGenerationFailed,
  markPanelGenerating,
  markPanelQueued,
} from "@/lib/studio/domain";
import { PANELS_SEED } from "@/lib/studio/mock-data";

describe("studio domain rules", () => {
  it("should allow the demo generation status flow", () => {
    expect(canTransitionPanelStatus("draft", "queued")).toBe(true);
    expect(canTransitionPanelStatus("queued", "generating")).toBe(true);
    expect(canTransitionPanelStatus("generating", "success")).toBe(true);
    expect(canTransitionPanelStatus("success", "generating")).toBe(true);
  });

  it("should mark queued and generating panels without keeping stale errors", () => {
    const panel = {
      ...PANELS_SEED[0],
      status: "error" as const,
      errorMessage: "Lỗi cũ",
    };

    expect(markPanelQueued(panel)).toMatchObject({
      status: "queued",
      errorMessage: undefined,
    });
    expect(markPanelGenerating(panel)).toMatchObject({
      status: "generating",
      errorMessage: undefined,
    });
  });

  it("should keep the previous image when a regeneration attempt fails", () => {
    const panel = {
      ...PANELS_SEED[0],
      status: "success" as const,
      imageUrl: "data:image/png;base64,old-image",
    };

    expect(markPanelGenerationFailed(panel, "Thử lại sau")).toMatchObject({
      status: "error",
      imageUrl: "data:image/png;base64,old-image",
      errorMessage: "Thử lại sau",
    });
  });
});
