/**
 * @file studio-api-contracts.test.ts
 * @description Unit tests for studio API schemas and fallback assets.
 */

import { describe, expect, it } from "vitest";

import {
  GeneratePanelResponseSchema,
  GeneratePanelRequestSchema,
  KaggleImageJobResponseSchema,
  StoryboardAiResponseSchema,
  StoryboardRequestSchema,
  StoryboardResponseSchema,
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

  it("should validate AI storyboard panels and characters shape", () => {
    const parsed = StoryboardAiResponseSchema.parse({
      panels: [
        {
          orderIndex: 1,
          scenePrompt: "A snowy inn beside the mountain road.",
          characters: ["Xiao Se"],
          dialogue: "Xiao Se: No guests today.",
        },
      ],
      characters: [
        {
          name: "Xiao Se",
          gender: "Nam",
          role: "Vai chính",
          description: "Mặc áo khoác lông xanh lá sang trọng.",
        },
      ],
    });
    expect(parsed.panels[0].characters).toEqual(["Xiao Se"]);
    expect(parsed.characters?.[0].name).toBe("Xiao Se");
    expect(parsed.characters?.[0].gender).toBe("Nam");
  });

  it("should normalize lowercase and English values for gender and role", () => {
    const parsed = StoryboardAiResponseSchema.parse({
      panels: [
        {
          orderIndex: 1,
          scenePrompt: "A snowy inn beside the mountain road.",
          characters: ["Xiao Se"],
          dialogue: "Xiao Se: No guests today.",
        },
      ],
      characters: [
        {
          name: "Xiao Se",
          gender: "male",
          role: "protagonist",
          description: "Mặc áo khoác lông xanh lá sang trọng.",
        },
        {
          name: "Sikong Qianluo",
          gender: "female",
          role: "supporting",
          description: "Cầm thương bạc.",
        },
      ],
    });
    expect(parsed.characters?.[0].gender).toBe("Nam");
    expect(parsed.characters?.[0].role).toBe("Vai chính");
    expect(parsed.characters?.[1].gender).toBe("Nữ");
    expect(parsed.characters?.[1].role).toBe("Vai phụ");
  });

  it("should normalize AI panels into app panel records", () => {
    const panels = normalizeStoryboardAiResponse({
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
    });

    expect(panels).toHaveLength(2);
    panels.forEach((panel) => {
      expect(panel.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
    expect(panels[0]).toMatchObject({
      orderIndex: 1,
      status: "draft",
      characterIds: ["xiao-se"],
    });
  });

  it("should create fallback storyboard responses and stable character slugs", () => {
    const response = createFallbackStoryboardResponse("A quiet road.");

    expect(response.source).toBe("fallback");
    expect(response.pages).toHaveLength(1);
    expect(response.pages[0].panels).toHaveLength(3);
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

  it("should accept storyboard and panel schemas with empty dialogue", () => {
    const aiResponseParse = StoryboardAiResponseSchema.safeParse({
      panels: [
        {
          orderIndex: 1,
          scenePrompt:
            "A scenic snow-covered view with no characters speaking.",
          characters: [],
          dialogue: "",
        },
      ],
    });
    expect(aiResponseParse.success).toBe(true);

    const emptyDialoguePanel = {
      ...PANELS_SEED[0],
      dialogue: "",
    };
    const generateRequestParse = GeneratePanelRequestSchema.safeParse({
      panel: emptyDialoguePanel,
      characters: [],
    });
    expect(generateRequestParse.success).toBe(true);
  });

  it("should accept non-breaking AI route telemetry fields", () => {
    expect(
      StoryboardResponseSchema.safeParse({
        source: "gemini",
        usedProvider: "gemini",
        usedModel: "gemini-3.5-flash",
        pages: [
          {
            id: "page-1",
            projectId: "project-1",
            orderIndex: 1,
            title: "Page 1",
            panels: PANELS_SEED,
          },
        ],
        characters: [
          {
            id: "xiao-se",
            name: "Xiao Se",
            role: "Vai chính",
            gender: "Nam",
            description: "Mô tả",
            color: "#8b5cf6",
          },
        ],
      }).success,
    ).toBe(true);

    expect(
      GeneratePanelResponseSchema.safeParse({
        panelId: "panel-1",
        imageUrl: "data:image/png;base64,test",
        source: "image-backend",
        usedProvider: "huggingface",
        usedModel: "black-forest-labs/FLUX.1-schnell",
      }).success,
    ).toBe(true);
  });

  it("should validate Kaggle image job responses", () => {
    expect(
      KaggleImageJobResponseSchema.safeParse({
        jobId: "job-1",
        panelId: "panel-1",
        status: "queued",
        usedProvider: "kaggle",
        retryAfterMs: 2000,
      }).success,
    ).toBe(true);

    expect(
      KaggleImageJobResponseSchema.safeParse({
        jobId: "job-1",
        panelId: "panel-1",
        status: "succeeded",
        imageUrl: "https://example.test/output.png",
        usedProvider: "kaggle",
      }).success,
    ).toBe(true);
  });
});
