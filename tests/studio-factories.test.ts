/**
 * @file studio-factories.test.ts
 * @description Unit tests for studio entity factories.
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_BUBBLE_HEIGHT,
  DEFAULT_BUBBLE_WIDTH,
  DEFAULT_BUBBLE_X,
  DEFAULT_BUBBLE_Y,
  GENERATED_BUBBLE_WIDTH,
  GENERATED_BUBBLE_X,
  GENERATED_BUBBLE_Y,
} from "@/lib/studio/constants";
import {
  createCharacter,
  createDefaultBubble,
  createGeneratedBubble,
  createProject,
} from "@/lib/studio/factories";
import type { Panel } from "@/lib/studio/types";

describe("studio factories", () => {
  it("should create a storyboard project with trimmed title", () => {
    const project = createProject("project-1", "  Demo Story  ", 4);

    expect(project).toMatchObject({
      id: "project-1",
      title: "Demo Story",
      status: "storyboard",
      updatedAt: "Just now",
      panelCount: 4,
      style: "webtoon",
    });
  });

  it("should generate random UUID when projectId is empty", () => {
    const project = createProject("", "Demo Story");
    expect(project.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(project.style).toBe("webtoon");
  });

  it("should create a character with predictable display copy", () => {
    const character = createCharacter(4);
    expect(character).toMatchObject({
      name: "Character 4",
      role: "Supporting role",
      color: "#06b6d4",
    });
    expect(character.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should create a default bubble using centralized dimensions", () => {
    const bubble = createDefaultBubble();
    expect(bubble).toMatchObject({
      text: "New speech bubble",
      x: DEFAULT_BUBBLE_X,
      y: DEFAULT_BUBBLE_Y,
      width: DEFAULT_BUBBLE_WIDTH,
      height: DEFAULT_BUBBLE_HEIGHT,
    });
    expect(bubble.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should create a generated bubble from panel dialogue", () => {
    const panel: Panel = {
      id: "panel-1",
      orderIndex: 1,
      scenePrompt: "Snowy inn",
      dialogue: "Xiao Se: This will cost you.",
      characterIds: ["xiao-se"],
      status: "success",
      imageTone: "from-zinc-900 to-zinc-800",
      bubbles: [],
      seed: 42,
    };

    const bubble = createGeneratedBubble(panel);
    expect(bubble).toMatchObject({
      text: "This will cost you.",
      x: GENERATED_BUBBLE_X,
      y: GENERATED_BUBBLE_Y,
      width: GENERATED_BUBBLE_WIDTH,
      height: DEFAULT_BUBBLE_HEIGHT,
    });
    expect(bubble.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
