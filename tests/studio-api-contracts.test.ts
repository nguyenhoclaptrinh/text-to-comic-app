/**
 * @file studio-api-contracts.test.ts
 * @description Unit tests for studio API schemas and fallback assets.
 */

import { describe, expect, it } from "vitest";

import {
  GeneratePanelRequestSchema,
  StoryboardAiResponseSchema,
  StoryboardRequestSchema,
} from "@/lib/studio/api-contracts";
import { createCachedPanelImage } from "@/lib/studio/cached-images";
import { PANELS_SEED } from "@/lib/studio/mock-data";
import {
  createFallbackStoryboardResponse,
  normalizeStoryboardAiResponse,
  slugifyCharacterName,
} from "@/lib/studio/storyboard";

describe("studio API contracts", () => {
  it("should accept valid storyboard requests and reject empty input", () => {
    expect(
      StoryboardRequestSchema.safeParse({
        storyTitle: "Snow Road Inn",
        storyText: "A short story with enough text.",
      }).success,
    ).toBe(true);

    expect(
      StoryboardRequestSchema.safeParse({
        storyTitle: "",
        storyText: "",
      }).success,
    ).toBe(false);
  });

  it("should validate AI storyboard panel shape", () => {
    expect(
      StoryboardAiResponseSchema.parse({
        panels: [
          {
            orderIndex: 1,
            scenePrompt: "A snowy inn beside the mountain road.",
            characters: ["Xiao Se"],
            dialogue: "Xiao Se: No guests today.",
          },
        ],
      }).panels[0].characters,
    ).toEqual(["Xiao Se"]);
  });

  it("should normalize AI panels into app panel records", () => {
    const panels = normalizeStoryboardAiResponse(
      {
        panels: [
          {
            orderIndex: 2,
            scenePrompt: "A red-robed traveler kicks open the inn door.",
            characters: ["Lei Wujie"],
            dialogue: "Lei Wujie: Noodles!",
          },
          {
            orderIndex: 1,
            scenePrompt: "A quiet inn waits under heavy snow.",
            characters: ["Xiao Se"],
            dialogue: "Xiao Se: Empty tables again.",
          },
        ],
      },
      123,
    );

    expect(panels.map((panel) => panel.id)).toEqual([
      "panel-123-1",
      "panel-123-2",
    ]);
    expect(panels[0]).toMatchObject({
      orderIndex: 1,
      status: "draft",
      characterIds: ["xiao-se"],
    });
  });

  it("should create fallback storyboard responses and stable character slugs", () => {
    const response = createFallbackStoryboardResponse("A quiet road.");

    expect(response.source).toBe("fallback");
    expect(response.panels).toHaveLength(3);
    expect(slugifyCharacterName("  Lei Wujie!! ")).toBe("lei-wujie");
  });

  it("should validate generate-panel requests and create cached image data URLs", () => {
    expect(
      GeneratePanelRequestSchema.safeParse({
        panel: PANELS_SEED[0],
        characters: [],
      }).success,
    ).toBe(true);

    expect(createCachedPanelImage(PANELS_SEED[0])).toMatch(
      /^data:image\/svg\+xml;charset=utf-8,/,
    );
  });
});
