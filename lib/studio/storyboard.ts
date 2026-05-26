/**
 * @file storyboard.ts
 * @description Storyboard response normalization and fallback creation.
 */

import { createMockPanels } from "@/lib/studio/utils";
import type {
  StoryboardAiResponse,
  StoryboardResponse,
} from "@/lib/studio/api-contracts";
import type { Panel } from "@/lib/studio/types";

const PANEL_IMAGE_TONES = [
  "from-slate-900 via-zinc-800 to-indigo-950",
  "from-red-950 via-zinc-800 to-amber-950",
  "from-zinc-900 via-stone-800 to-slate-900",
  "from-cyan-950 via-zinc-800 to-emerald-950",
];

export function createFallbackStoryboardResponse(
  storyText: string,
  projectId = `project-${Date.now()}`,
  warning = "Gemini is not configured. Using deterministic fallback storyboard.",
): StoryboardResponse {
  const panels = createMockPanels(storyText);
  return {
    pages: [
      {
        id: `page-${Date.now()}-1`,
        projectId,
        orderIndex: 1,
        title: "Page 1",
        panels,
      },
    ],
    source: "fallback",
    warning,
  };
}

export function normalizeStoryboardAiResponse(
  response: StoryboardAiResponse,
  timestamp = Date.now(),
): Panel[] {
  return response.panels
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((panel, index) => ({
      id: `panel-${timestamp}-${index + 1}`,
      orderIndex: index + 1,
      scenePrompt: panel.scenePrompt,
      dialogue: panel.dialogue,
      characterIds: panel.characters.map(slugifyCharacterName),
      status: "draft",
      imageTone: PANEL_IMAGE_TONES[index % PANEL_IMAGE_TONES.length],
      bubbles: [],
      seed: Math.floor(Math.random() * 1000000),
    }));
}

export function slugifyCharacterName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "unknown-character";
}
