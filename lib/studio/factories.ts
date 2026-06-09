/**
 * @file factories.ts
 * @description Factory helpers for creating mock studio entities.
 */

import {
  DEFAULT_BUBBLE_HEIGHT,
  DEFAULT_BUBBLE_WIDTH,
  DEFAULT_BUBBLE_X,
  DEFAULT_BUBBLE_Y,
  GENERATED_BUBBLE_WIDTH,
  GENERATED_BUBBLE_X,
  GENERATED_BUBBLE_Y,
} from "@/lib/studio/constants";
import { dialogueToBubble } from "@/lib/studio/utils";
import type { Bubble, Character, Panel, Project } from "@/lib/studio/types";

export function createProject(
  projectId: string,
  storyTitle: string,
  panelCount = 0,
  genre?: string,
  aspectRatio?: string,
): Project {
  return {
    id: projectId || crypto.randomUUID(),
    title: storyTitle.trim(),
    status: "storyboard",
    updatedAt: "Just now",
    panelCount,
    style: "webtoon",
    genre,
    aspectRatio,
  };
}

export function createCharacter(nextIndex: number): Character {
  return {
    id: crypto.randomUUID(),
    name: `Character ${nextIndex}`,
    role: "Supporting role",
    description: "Add a short visual description before image generation.",
    color: "#06b6d4",
  };
}

export function createDefaultBubble(): Bubble {
  return {
    id: crypto.randomUUID(),
    text: "New speech bubble",
    x: DEFAULT_BUBBLE_X,
    y: DEFAULT_BUBBLE_Y,
    width: DEFAULT_BUBBLE_WIDTH,
    height: DEFAULT_BUBBLE_HEIGHT,
  };
}

export function createGeneratedBubble(panel: Panel): Bubble {
  return {
    id: crypto.randomUUID(),
    text: dialogueToBubble(panel.dialogue),
    x: GENERATED_BUBBLE_X,
    y: GENERATED_BUBBLE_Y,
    width: GENERATED_BUBBLE_WIDTH,
    height: DEFAULT_BUBBLE_HEIGHT,
  };
}
