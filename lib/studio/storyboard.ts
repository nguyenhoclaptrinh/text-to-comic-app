/**
 * @file storyboard.ts
 * @description Storyboard response normalization and fallback creation.
 */

import { chunkStoryText } from "@/lib/server/chunking-engine";
import { createMockPanels, dialogueToBubble } from "@/lib/studio/utils";
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
  projectId = crypto.randomUUID(),
  warning = "Gemini is not configured. Using deterministic fallback storyboard.",
): StoryboardResponse {
  const chunks = chunkStoryText(storyText, 4500);
  const pages = chunks.map((chunk, index) => {
    const panels = createMockPanels(chunk);
    return {
      id: crypto.randomUUID(),
      projectId,
      orderIndex: index + 1,
      title: `Page ${index + 1}`,
      panels,
    };
  });

  return {
    pages,
    source: "fallback",
    warning,
  };
}

export function normalizeStoryboardAiResponse(
  response: StoryboardAiResponse,
): Panel[] {
  return response.panels
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((panel, index) => ({
      id: crypto.randomUUID(),
      orderIndex: index + 1,
      scenePrompt: panel.scenePrompt,
      dialogue: panel.dialogue,
      characterIds: panel.characters.map(slugifyCharacterName),
      status: "draft",
      imageTone: PANEL_IMAGE_TONES[index % PANEL_IMAGE_TONES.length],
      bubbles: panel.dialogue && panel.dialogue.trim()
        ? [
            {
              id: crypto.randomUUID(),
              text: dialogueToBubble(panel.dialogue),
              x: 35,
              y: 15,
              width: 30,
              height: 12,
            },
          ]
        : [],
      seed: Math.floor(Math.random() * 1000000),
      style: "inherit",
    }));
}

export function slugifyCharacterName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "unknown-character";
}
