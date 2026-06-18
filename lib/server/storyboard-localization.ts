import { z } from "zod";

import {
  createAiProviderErrorFromResponse,
  fetchWithTimeout,
  getAiTimeoutMs,
} from "@/lib/server/ai-router";
import type { StoryboardAiResponse } from "@/lib/studio/api-contracts";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

const ParallelLocalizedStoryboardSchema = z.object({
  panels: z.array(
    z.object({
      orderIndex: z.number().int().positive(),
      scenePromptDisplayVi: z.string(),
      dialogueDisplayVi: z.string(),
    }),
  ),
  characters: z
    .array(
      z.object({
        name: z.string(),
        descriptionDisplayVi: z.string(),
      }),
    )
    .optional(),
});

export type ParallelLocalizedStoryboard = {
  panels: Array<{
    orderIndex: number;
    scenePromptDisplayEn: string;
    scenePromptDisplayVi: string;
    dialogueDisplayEn: string;
    dialogueDisplayVi: string;
  }>;
  characters?: Array<{
    name: string;
    descriptionDisplayEn: string;
    descriptionDisplayVi: string;
  }>;
};

export async function localizeStoryboardForDisplay({
  storyboard,
  apiKey,
  model,
}: {
  storyboard: StoryboardAiResponse;
  apiKey?: string;
  model: string;
}): Promise<ParallelLocalizedStoryboard | null> {
  const baseEnglish: ParallelLocalizedStoryboard = {
    panels: storyboard.panels.map((panel) => ({
      orderIndex: panel.orderIndex,
      scenePromptDisplayEn: panel.scenePrompt,
      scenePromptDisplayVi: panel.scenePrompt,
      dialogueDisplayEn: panel.dialogue,
      dialogueDisplayVi: panel.dialogue,
    })),
    characters: storyboard.characters?.map((character) => ({
      name: character.name,
      descriptionDisplayEn: character.description,
      descriptionDisplayVi: character.description,
    })),
  };

  if (!apiKey) {
    return baseEnglish;
  }

  const prompt = createLocalizationPrompt(storyboard);
  const response = await fetchWithTimeout(
    `${GEMINI_ENDPOINT}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    },
    getAiTimeoutMs(),
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw createAiProviderErrorFromResponse(response, detail);
  }

  const data: unknown = await response.json();
  const text = extractGeminiText(data);
  const parsed = JSON.parse(stripJsonFence(text));
  const localized = ParallelLocalizedStoryboardSchema.parse(parsed);

  return {
    panels: baseEnglish.panels.map((panel) => {
      const localizedPanel = localized.panels.find(
        (item) => item.orderIndex === panel.orderIndex,
      );
      return {
        ...panel,
        scenePromptDisplayVi:
          localizedPanel?.scenePromptDisplayVi || panel.scenePromptDisplayEn,
        dialogueDisplayVi:
          localizedPanel?.dialogueDisplayVi || panel.dialogueDisplayEn,
      };
    }),
    characters: baseEnglish.characters?.map((character) => {
      const localizedCharacter = localized.characters?.find(
        (item) => item.name === character.name,
      );
      return {
        ...character,
        descriptionDisplayVi:
          localizedCharacter?.descriptionDisplayVi ||
          character.descriptionDisplayEn,
      };
    }),
  };
}

function createLocalizationPrompt(storyboard: StoryboardAiResponse) {
  return [
    "You are a strict JSON localization engine for a comic storyboard app.",
    "Translate the provided canonical English storyboard into Vietnamese.",
    "Keep the JSON structure exactly the same as requested.",
    "Do not add or remove panels or characters.",
    "Do not add explanations.",
    "Preserve proper names unless there is a standard localized form.",
    "Translate only user-facing display text.",
    "Do not change meaning, tone, or story details.",
    "Return JSON only.",
    "",
    "Return this shape:",
    '{"panels":[{"orderIndex":1,"scenePromptDisplayVi":"...","dialogueDisplayVi":"..."}],"characters":[{"name":"...","descriptionDisplayVi":"..."}]}',
    "",
    `Canonical storyboard JSON: ${JSON.stringify(storyboard)}`,
  ].join("\n\n");
}

function extractGeminiText(data: unknown) {
  if (!isRecord(data)) {
    return "";
  }

  const candidates = data.candidates;
  if (!Array.isArray(candidates)) {
    return "";
  }

  return candidates
    .flatMap((candidate) =>
      isRecord(candidate) &&
      isRecord(candidate.content) &&
      Array.isArray(candidate.content.parts)
        ? candidate.content.parts
        : [],
    )
    .map((part) =>
      isRecord(part) && typeof part.text === "string" ? part.text : "",
    )
    .join("");
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
