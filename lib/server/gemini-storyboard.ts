/**
 * @file gemini-storyboard.ts
 * @description Server-side Gemini text-to-storyboard provider.
 */

import {
  StoryboardAiResponseSchema,
  type StoryboardAiResponse,
  type StoryboardRequest,
} from "@/lib/studio/api-contracts";
import {
  createAiProviderErrorFromResponse,
  createModelCandidates,
  fetchWithTimeout,
  getAiTimeoutMs,
  parseModelList,
  routeAiModels,
} from "@/lib/server/ai-router";
import { chunkStoryText } from "@/lib/server/chunking-engine";
import { localizeStoryboardForDisplay } from "@/lib/server/storyboard-localization";
import { getPanelBubbleSeed, isSeedBubbleText } from "@/lib/studio/display";
import {
  normalizeStoryboardAiResponse,
  slugifyCharacterName,
} from "@/lib/studio/storyboard";
import { createMockPanels } from "@/lib/studio/utils";
import { isDemoFallbackEnabled } from "@/lib/server/runtime-config";
import type { Page, Panel, Character } from "@/lib/studio/types";

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
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
    characters: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          gender: { type: "STRING", enum: ["Nam", "Nữ", "Khác"] },
          role: {
            type: "STRING",
            enum: ["Vai chính", "Vai phụ", "Phản diện", "Quần chúng"],
          },
          description: { type: "STRING" },
        },
        required: ["name", "gender", "role", "description"],
        propertyOrdering: ["name", "gender", "role", "description"],
      },
    },
  },
  required: ["panels", "characters"],
  propertyOrdering: ["panels", "characters"],
};

export const GEMINI_TEXT_MODELS_POOL = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

export async function generateMultiPageStoryboard(
  input: StoryboardRequest,
  projectId = crypto.randomUUID(),
  customApiKey?: string,
): Promise<{
  pages: Page[];
  characters: Character[];
  source: "gemini" | "fallback";
  usedModel?: string;
  usedProvider?: "gemini" | "fallback";
}> {
  const chunks = chunkStoryText(input.storyText, 4500);
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const preferredModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const outputLanguage = input.outputLanguage || "en";

  const pages: Page[] = [];
  const charactersMap = new Map<string, Character>();
  const source: "gemini" | "fallback" = apiKey ? "gemini" : "fallback";
  let finalUsedModel: string | undefined = undefined;

  let charColorIdx = 0;
  const colors = [
    "#8b5cf6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#ec4899",
  ];

  for (const [index, chunk] of chunks.entries()) {
    const pageId = crypto.randomUUID();
    const pageTitle = `Page ${index + 1}`;
    let panels: Panel[] = [];

    if (apiKey) {
      try {
        const geminiResponse = await generateStoryboardWithGemini(
          { storyTitle: input.storyTitle, storyText: chunk },
          apiKey,
          preferredModel,
        );

        if (geminiResponse) {
          panels = normalizeStoryboardAiResponse(geminiResponse.storyboard);
          finalUsedModel = geminiResponse.usedModel;

          const localized = await localizeStoryboardForDisplay({
            storyboard: geminiResponse.storyboard,
            apiKey,
            model: geminiResponse.usedModel,
          }).catch((err) => {
            console.warn(
              "[Gemini Localization] Error on page " + (index + 1) + ":",
              err,
            );
            return null;
          });

          panels = panels.map((panel) => {
            const localizedPanel = localized?.panels.find(
              (item) => item.orderIndex === panel.orderIndex,
            );

            const nextPanel = {
              ...panel,
              scenePromptDisplayEn:
                localizedPanel?.scenePromptDisplayEn || panel.scenePrompt,
              scenePromptDisplayVi:
                localizedPanel?.scenePromptDisplayVi || panel.scenePrompt,
              dialogueDisplayEn:
                localizedPanel?.dialogueDisplayEn || panel.dialogue,
              dialogueDisplayVi:
                localizedPanel?.dialogueDisplayVi || panel.dialogue,
            };

            const canSyncSeedBubble =
              nextPanel.bubbles.length === 1 &&
              isSeedBubbleText(nextPanel, nextPanel.bubbles[0]?.text || "");
            const nextBubbleText = getPanelBubbleSeed(
              nextPanel,
              outputLanguage,
            );

            return {
              ...nextPanel,
              bubbles: canSyncSeedBubble
                ? nextBubbleText
                  ? nextPanel.bubbles.map((bubble, idx) =>
                      idx === 0 ? { ...bubble, text: nextBubbleText } : bubble,
                    )
                  : []
                : nextPanel.bubbles,
            };
          });

          if (geminiResponse.storyboard.characters) {
            for (const c of geminiResponse.storyboard.characters) {
              const localizedCharacter = localized?.characters?.find(
                (item) => item.name === c.name,
              );
              const id = slugifyCharacterName(c.name);
              if (!charactersMap.has(id)) {
                charactersMap.set(id, {
                  id,
                  projectId,
                  name: c.name,
                  role: c.role,
                  gender: c.gender,
                  description: c.description,
                  descriptionDisplayEn:
                    localizedCharacter?.descriptionDisplayEn || c.description,
                  descriptionDisplayVi:
                    localizedCharacter?.descriptionDisplayVi || c.description,
                  descriptionDisplay:
                    localizedCharacter?.descriptionDisplayVi || c.description,
                  color: colors[charColorIdx % colors.length],
                });
                charColorIdx++;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[Gemini Sync] Error on page ${index + 1}:`, err);
      }
    }

    if (panels.length === 0 && isDemoFallbackEnabled()) {
      panels = createMockPanels(chunk);
    }

    if (panels.length === 0) {
      throw new Error(
        `Storyboard provider failed for page ${index + 1} and demo fallback is disabled.`,
      );
    }

    pages.push({
      id: pageId,
      projectId,
      orderIndex: index + 1,
      title: pageTitle,
      panels,
    });
  }

  return {
    pages,
    characters: Array.from(charactersMap.values()),
    source,
    usedModel: finalUsedModel,
    usedProvider: finalUsedModel ? "gemini" : "fallback",
  };
}

export async function generateStoryboardWithGemini(
  input: StoryboardRequest,
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
): Promise<{ storyboard: StoryboardAiResponse; usedModel: string } | null> {
  if (!apiKey) {
    return null;
  }

  const { text: firstResponse, usedModel } = await requestGeminiWithRotation({
    apiKey,
    preferredModel: model,
    prompt: createStoryboardPrompt(input),
  });

  const parsed = parseGeminiStoryboard(firstResponse);
  if (parsed) {
    return { storyboard: parsed, usedModel };
  }

  const repairedResponse = await requestGeminiJson({
    apiKey,
    model: usedModel,
    prompt: createRepairPrompt(firstResponse),
  });
  const repaired = parseGeminiStoryboard(repairedResponse);

  if (!repaired) {
    throw new Error("Gemini returned invalid storyboard JSON.");
  }

  return { storyboard: repaired, usedModel };
}

async function requestGeminiWithRotation({
  apiKey,
  preferredModel,
  prompt,
}: {
  apiKey: string;
  preferredModel: string;
  prompt: string;
}): Promise<{ text: string; usedModel: string }> {
  const models = parseModelList(process.env.GEMINI_TEXT_MODELS, [
    preferredModel,
    ...GEMINI_TEXT_MODELS_POOL.filter((m) => m !== preferredModel),
  ]);
  const candidates = createModelCandidates({
    provider: "gemini",
    capability: "storyboard",
    models,
  });

  const routed = await routeAiModels({
    candidates,
    policy: { maxAttempts: models.length, timeoutMs: getAiTimeoutMs() },
    run: async (candidate) => {
      console.log(
        `[Gemini Rotation] Attempting storyboard generation with model: ${candidate.model}`,
      );
      return requestGeminiJson({
        apiKey,
        model: candidate.model,
        prompt,
      });
    },
  });

  if (routed.ok) {
    return { text: routed.value, usedModel: routed.model };
  }

  throw new Error(routed.warning);
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
          responseSchema: GEMINI_RESPONSE_SCHEMA,
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
    "Convert the story into 3 to 6 comic panels in English.",
    "Each panel must be visually actionable for image generation.",
    "Keep dialogue short enough for speech bubbles.",
    "Return scenePrompt, dialogue, and character descriptions in English only.",
    "",
    "Also analyze and extract the complete list of characters appearing in the story. For each character, provide:",
    "- name: Their name",
    "- gender: Gender, strictly one of: 'Nam', 'Nữ', 'Khác'",
    "- role: Role, strictly one of: 'Vai chính', 'Vai phụ', 'Phản diện', 'Quần chúng'",
    "- description: A detailed physical appearance description (e.g. hair style/color, clothing style, accessories, face features) that is suitable to keep visual consistency when generating images.",
    "",
    `Title: ${storyTitle}`,
    `Story: ${storyText}`,
  ].join("\n\n");
}

function createRepairPrompt(rawText: string) {
  return [
    "Repair the following response into valid JSON that matches this shape:",
    "Ensure all scenePrompt, dialogue, and description values remain in English.",
    '{"panels":[{"orderIndex":1,"scenePrompt":"...","characters":["..."],"dialogue":"..."}],"characters":[{"name":"...","gender":"Nam/Nữ/Khác","role":"Vai chính/Vai phụ/Phản diện/Quần chúng","description":"..."}]}',
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

export async function generateStorySuggestion({
  title,
  style,
  genre,
  aspectRatio,
  customApiKey,
}: {
  title: string;
  style: string;
  genre: string;
  aspectRatio: string;
  customApiKey?: string;
}): Promise<{ storyText: string }> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key.");
  }
  const preferredModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const prompt = `Bạn là một biên kịch truyện tranh chuyên nghiệp. Hãy viết một cốt truyện chữ chi tiết dùng để phân cảnh làm truyện tranh (webtoon/manga/comic).
Thông tin đầu vào:
- Tiêu đề truyện: "${title}"
- Thể loại truyện: "${genre}"
- Phong cách vẽ tranh: "${style}"
- Tỉ lệ khung hình mong muốn: "${aspectRatio}"

Yêu cầu kịch bản truyện chữ:
1. Viết một câu chuyện hấp dẫn, lôi cuốn bằng tiếng Việt.
2. Trình bày cốt truyện dưới dạng các đoạn văn rõ ràng, có diễn biến tâm lý nhân vật, mô tả chi tiết bối cảnh xung quanh và các câu thoại trực tiếp của nhân vật đặt trong dấu ngoặc kép (Ví dụ: Tèo nói: "Chào buổi sáng!").
3. Hãy viết dài khoảng 3-4 đoạn văn để đủ tạo ra 4-8 khung hình truyện tranh phong phú.
4. Trả về dưới định dạng JSON với cấu trúc chính xác:
{
  "storyText": "Nội dung kịch bản chi tiết ở đây..."
}
Chú ý: Chỉ trả về JSON hợp lệ, không kèm giải thích hay Markdown codeblock.`;

  const response = await fetchWithTimeout(
    `${GEMINI_ENDPOINT}/models/${preferredModel}:generateContent`,
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
          responseSchema: {
            type: "OBJECT",
            properties: {
              storyText: { type: "STRING" },
            },
            required: ["storyText"],
          },
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
  try {
    const parsed = JSON.parse(stripJsonFence(text));
    if (parsed && typeof parsed.storyText === "string") {
      return { storyText: parsed.storyText };
    }
  } catch (err) {
    console.error("Failed to parse suggest-story response:", err);
  }
  throw new Error("Không thể phân tích dữ liệu gợi ý kịch bản từ AI.");
}
