/**
 * @file utils.ts
 * @description Pure helpers for mock generation, text extraction, and numeric bounds.
 */

import {
  BUBBLE_BOUNDARY_PADDING,
  BUBBLE_TEXT_MAX_LENGTH,
  STORY_EXCERPT_MAX_LENGTH,
} from "@/lib/studio/constants";
import type { Bubble, Panel } from "@/lib/studio/types";

export function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function dialogueToBubble(dialogue: string) {
  const [, text = dialogue] = dialogue.split(":");
  return text.trim().slice(0, BUBBLE_TEXT_MAX_LENGTH);
}

export function nextBubbleCoordinate(
  pointer: number,
  stageStart: number,
  offset: number,
  stageSize: number,
  itemSize: number,
) {
  const max = Math.max(
    stageSize - itemSize - BUBBLE_BOUNDARY_PADDING,
    BUBBLE_BOUNDARY_PADDING,
  );
  return Math.round(
    clamp(pointer - stageStart - offset, BUBBLE_BOUNDARY_PADDING, max),
  );
}

export function updatePanelBubble(
  panel: Panel,
  panelId: string,
  bubbleId: string,
  patch: Partial<Bubble>,
) {
  if (panel.id !== panelId) {
    return panel;
  }

  return {
    ...panel,
    bubbles: panel.bubbles.map((bubble) =>
      bubble.id === bubbleId ? { ...bubble, ...patch } : bubble,
    ),
  };
}

export function createMockPanels(
  storyText: string,
  timestamp = Date.now(),
): Panel[] {
  const excerpt = storyText.trim().slice(0, STORY_EXCERPT_MAX_LENGTH);

  return [
    {
      id: `panel-${timestamp}-1`,
      orderIndex: 1,
      scenePrompt: `${excerpt}... Establish the location, mood, and first character.`,
      dialogue: "Narrator: The story begins under a cold sky.",
      characterIds: ["xiao-se"],
      status: "draft",
      imageTone: "from-slate-900 via-zinc-800 to-indigo-950",
      bubbles: [],
    },
    {
      id: `panel-${timestamp}-2`,
      orderIndex: 2,
      scenePrompt:
        "A second character enters the scene and changes the rhythm of the moment.",
      dialogue: "New arrival: I finally found this place.",
      characterIds: ["lei-wujie"],
      status: "draft",
      imageTone: "from-red-950 via-zinc-800 to-amber-950",
      bubbles: [],
    },
    {
      id: `panel-${timestamp}-3`,
      orderIndex: 3,
      scenePrompt:
        "The two characters react to each other, setting up the next scene.",
      dialogue: "Xiao Se: This will cost you.",
      characterIds: ["xiao-se", "lei-wujie"],
      status: "draft",
      imageTone: "from-zinc-900 via-stone-800 to-slate-900",
      bubbles: [],
    },
  ];
}
