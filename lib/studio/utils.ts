/**
 * @file utils.ts
 * @description Pure helpers for mock generation, text extraction, and numeric bounds.
 */

import {
  BUBBLE_BOUNDARY_PADDING,
  BUBBLE_TEXT_MAX_LENGTH,
} from "@/lib/studio/constants";
import type { Bubble, Character, Panel } from "@/lib/studio/types";

export function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
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
  itemSizePercent: number,
) {
  const pixelPos = pointer - stageStart - offset;
  const percent = (pixelPos / stageSize) * 100;
  const max = Math.max(
    100 - itemSizePercent - BUBBLE_BOUNDARY_PADDING,
    BUBBLE_BOUNDARY_PADDING,
  );
  return Math.round(clamp(percent, BUBBLE_BOUNDARY_PADDING, max));
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

export function updateCharacterProfile(
  character: Character,
  characterId: string,
  patch: Partial<Character>,
) {
  if (character.id === characterId) {
    return { ...character, ...patch };
  }
  return character;
}

export function createMockPanels(storyText: string): Panel[] {
  const cleanText = storyText.trim();
  const sentences = cleanText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length === 0) {
    sentences.push("A quiet scene unfolds.");
  }

  // Chia panel động: tối thiểu 3 panel, tối đa 8 panel tùy theo độ dài câu
  const panelCount = clamp(Math.ceil(sentences.length / 2), 3, 8);
  const chunks: string[][] = Array.from({ length: panelCount }, () => []);

  const chunkSize = Math.ceil(sentences.length / panelCount);
  for (let i = 0; i < panelCount; i++) {
    chunks[i] = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
  }

  const defaultTones = [
    "from-slate-900 via-zinc-800 to-indigo-950",
    "from-red-950 via-zinc-800 to-amber-950",
    "from-zinc-900 via-stone-800 to-slate-900",
    "from-cyan-950 via-zinc-800 to-emerald-950",
  ];

  return chunks.map((chunkSentences, index) => {
    const textFragment = chunkSentences.join(" ") || "The story continues.";
    let dialogue = "";
    let characterIds: string[] = [];

    // Hỗ trợ trích xuất tiếng Việt có dấu dạng: "Tên nhân vật: Lời thoại"
    const colonMatch = textFragment.match(/^([A-ZÀ-Ỹa-zà-ỹ\s]+):\s*(.+)$/ui);
    if (colonMatch) {
      dialogue = `${colonMatch[1].trim()}: ${colonMatch[2].trim()}`;
      characterIds = [
        colonMatch[1]
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9à-ỹ]+/gi, "-"),
      ];
    } else {
      // Hỗ trợ trích xuất thoại trong dấu ngoặc kép "..." hoặc “...”
      const quoteMatch = textFragment.match(/["“]([^"”]+)["”]/);
      if (quoteMatch) {
        const speechIndicator = textFragment.match(/([A-ZÀ-Ỹa-zà-ỹ\s]+)\s+(nói|hỏi|trả lời|thầm nghĩ|cười)/ui);
        const speaker = speechIndicator ? speechIndicator[1].trim() : "Speaker";
        dialogue = `${speaker}: ${quoteMatch[1].trim()}`;
        characterIds = [
          speaker
            .toLowerCase()
            .replace(/[^a-z0-9à-ỹ]+/gi, "-"),
        ];
      }
    }

    if (dialogue.length > BUBBLE_TEXT_MAX_LENGTH) {
      dialogue = dialogue.slice(0, BUBBLE_TEXT_MAX_LENGTH - 3) + "...";
    }

    const scenePrompt = `An illustrative comic panel depicting: ${textFragment.slice(0, 300)}. Highly detailed, comic book style.`;

    return {
      id: crypto.randomUUID(),
      orderIndex: index + 1,
      scenePrompt,
      dialogue,
      characterIds,
      status: "draft",
      imageTone: defaultTones[index % defaultTones.length],
      bubbles: [],
      seed: Math.floor(Math.random() * 1000000),
      style: "inherit",
    };
  });
}
