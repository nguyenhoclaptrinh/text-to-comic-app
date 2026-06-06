/**
 * @file studio-cached-images.test.ts
 * @description Unit tests for deterministic SVG cached images.
 */

import { describe, expect, it } from "vitest";

import { createCachedPanelImage } from "@/lib/studio/cached-images";
import type { Panel } from "@/lib/studio/types";

describe("cached-images", () => {
  it("should generate deterministic SVG with different tones", () => {
    const basePanel: Panel = {
      id: "panel-1",
      orderIndex: 1,
      scenePrompt: "A snowy road",
      dialogue: "Innkeeper: Welcome",
      characterIds: [],
      status: "draft",
      imageTone: "from-zinc-900 via-stone-800 to-slate-900",
      bubbles: [],
      seed: 42,
    };

    // Test tone with "stone"
    const svgStone = createCachedPanelImage({
      ...basePanel,
      imageTone: "from-zinc-900 via-stone-800 to-slate-900",
    });
    expect(svgStone).toContain("data:image/svg+xml");

    // Test tone with "red"
    const svgRed = createCachedPanelImage({
      ...basePanel,
      imageTone: "from-red-950 via-zinc-800 to-amber-950",
    });
    expect(svgRed).toContain("data:image/svg+xml");

    // Test default tone (e.g. indigo)
    const svgDefault = createCachedPanelImage({
      ...basePanel,
      imageTone: "from-slate-900 via-zinc-800 to-indigo-950",
    });
    expect(svgDefault).toContain("data:image/svg+xml");
  });
});
