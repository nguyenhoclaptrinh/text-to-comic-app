/**
 * @file studio-factories.test.ts
 * @description Unit tests for studio entity factories.
 */

import { describe, expect, it, vi } from "vitest";

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
    const project = createProject("project-1", "  Demo Story  ");

    expect(project).toMatchObject({
      id: "project-1",
      title: "Demo Story",
      status: "storyboard",
      updatedAt: "Just now",
      panelCount: 3,
    });
  });

  it("should create a character with predictable display copy", () => {
    vi.spyOn(Date, "now").mockReturnValue(500);

    expect(createCharacter(4)).toMatchObject({
      id: "character-500",
      name: "Character 4",
      role: "Supporting role",
      color: "#06b6d4",
    });

    vi.restoreAllMocks();
  });

  it("should create a default bubble using centralized dimensions", () => {
    vi.spyOn(Date, "now").mockReturnValue(700);

    expect(createDefaultBubble()).toEqual({
      id: "bubble-700",
      text: "New speech bubble",
      x: DEFAULT_BUBBLE_X,
      y: DEFAULT_BUBBLE_Y,
      width: DEFAULT_BUBBLE_WIDTH,
      height: DEFAULT_BUBBLE_HEIGHT,
    });

    vi.restoreAllMocks();
  });

  it("should create a generated bubble from panel dialogue", () => {
    vi.spyOn(Date, "now").mockReturnValue(900);
    const panel: Panel = {
      id: "panel-1",
      orderIndex: 1,
      scenePrompt: "Snowy inn",
      dialogue: "Xiao Se: This will cost you.",
      characterIds: ["xiao-se"],
      status: "success",
      imageTone: "from-zinc-900 to-zinc-800",
      bubbles: [],
    };

    expect(createGeneratedBubble(panel)).toEqual({
      id: "bubble-panel-1-900",
      text: "This will cost you.",
      x: GENERATED_BUBBLE_X,
      y: GENERATED_BUBBLE_Y,
      width: GENERATED_BUBBLE_WIDTH,
      height: DEFAULT_BUBBLE_HEIGHT,
    });

    vi.restoreAllMocks();
  });
});
