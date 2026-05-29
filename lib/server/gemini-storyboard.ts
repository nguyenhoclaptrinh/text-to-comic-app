/**
 * @file gemini-storyboard.ts
 * @description Server-side Gemini text-to-storyboard provider.
 */

import {
  StoryboardAiResponseSchema,
  type StoryboardAiResponse,
  type StoryboardRequest,
} from "@/lib/studio/api-contracts";
import { chunkStoryText } from "@/lib/server/chunking-engine";
import { normalizeStoryboardAiResponse } from "@/lib/studio/storyboard";
import { createMockPanels } from "@/lib/studio/utils";
import type { Page, Panel } from "@/lib/studio/types";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    panels: {
      type: "ARRAY",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "OBJECT",
        properties: {
          orderIndex: { type: "INTEGER" },
          scenePrompt: { type: "STRING" },
          characters: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          dialogue: { type: "STRING" },
        },
        required: ["orderIndex", "scenePrompt", "characters", "dialogue"],
        propertyOrdering: [
          "orderIndex",
          "scenePrompt",
          "characters",
          "dialogue",
        ],
      },
    },
  },
  required: ["panels"],
  propertyOrdering: ["panels"],
};

export async function generateMultiPageStoryboard(
  input: StoryboardRequest,
  projectId = crypto.randomUUID(),
): Promise<{ pages: Page[]; source: "gemini" | "fallback" }> {
  const chunks = chunkStoryText(input.storyText, 4500);
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const pages: Page[] = [];
  const source: "gemini" | "fallback" = apiKey ? "gemini" : "fallback";

  for (const [index, chunk] of chunks.entries()) {
    const pageId = crypto.randomUUID();
    const pageTitle = `Page ${index + 1}`;
    let panels: Panel[] = [];

    if (apiKey) {
      try {
        const geminiResponse = await generateStoryboardWithGemini(
          { storyTitle: input.storyTitle, storyText: chunk },
          apiKey,
          model,
        );

        if (geminiResponse) {
          panels = normalizeStoryboardAiResponse(geminiResponse);
        }
      } catch (err) {
        console.warn(`[Gemini Sync] Error on page ${index + 1}:`, err);
      }
    }

    if (panels.length === 0) {
      panels = createMockPanels(chunk);
    }

    pages.push({
      id: pageId,
      projectId,
      orderIndex: index + 1,
      title: pageTitle,
      panels,
    });
  }

  return { pages, source };
}

export async function generateStoryboardWithGemini(
  input: StoryboardRequest,
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
) {
  if (!apiKey) {
    return null;
  }

  const firstResponse = await requestGeminiJson({
    apiKey,
    model,
    prompt: createStoryboardPrompt(input),
  });
  const parsed = parseGeminiStoryboard(firstResponse);
  if (parsed) {
    return parsed;
  }

  const repairedResponse = await requestGeminiJson({
    apiKey,
    model,
    prompt: createRepairPrompt(firstResponse),
  });
  const repaired = parseGeminiStoryboard(repairedResponse);

  if (!repaired) {
    throw new Error("Gemini returned invalid storyboard JSON.");
  }

  return repaired;
}

async function requestGeminiJson({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(
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
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const data: unknown = await response.json();
  return extractGeminiText(data);
}

function parseGeminiStoryboard(rawText: string): StoryboardAiResponse | null {
  try {
    const parsed: unknown = JSON.parse(stripJsonFence(rawText));
    const result = StoryboardAiResponseSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
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

function createStoryboardPrompt({ storyTitle, storyText }: StoryboardRequest) {
  return [
    "You are a storyboard assistant for an AI-assisted comic creation app.",
    "Convert the story into 3 to 6 comic panels.",
    "Each panel must be visually actionable for image generation.",
    "Keep dialogue short enough for speech bubbles.",
    `Title: ${storyTitle}`,
    `Story: ${storyText}`,
  ].join("\n\n");
}

function createRepairPrompt(rawText: string) {
  return [
    "Repair the following response into valid JSON that matches this shape:",
    '{"panels":[{"orderIndex":1,"scenePrompt":"...","characters":["..."],"dialogue":"..."}]}',
    "Return JSON only.",
    rawText,
  ].join("\n\n");
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
