/**
 * @file api-contracts.ts
 * @description Zod schemas and typed contracts for studio API boundaries.
 */

import { z } from "zod";

export const StudioApiErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "AI_TEXT_QUOTA",
  "AI_TEXT_POLICY_BLOCK",
  "AI_TEXT_INVALID_JSON",
  "AI_TEXT_UNAVAILABLE",
  "AI_IMAGE_OFFLINE",
  "AI_IMAGE_TIMEOUT",
  "AI_IMAGE_INVALID_RESPONSE",
]);

export const StudioApiErrorSchema = z.object({
  code: StudioApiErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean().default(true),
});

export const StoryboardRequestSchema = z.object({
  storyTitle: z.string().trim().min(1).max(140),
  storyText: z.string().trim().min(1).max(12000),
  outputLanguage: z.enum(["en", "vi"]).optional(),
});

export const StoryboardAiPanelSchema = z.object({
  orderIndex: z.number().int().positive(),
  scenePrompt: z.string().trim().min(8).max(1200),
  characters: z.array(z.string().trim().min(1).max(80)).max(8),
  dialogue: z.string().trim().max(800),
});

export const StoryboardAiCharacterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  gender: z.preprocess((val) => {
    if (typeof val === "string") {
      const lower = val.trim().toLowerCase();
      if (lower === "nam" || lower === "male") return "Nam";
      if (lower === "nữ" || lower === "female") return "Nữ";
      if (lower === "khác" || lower === "other") return "Khác";
    }
    return val;
  }, z.enum(["Nam", "Nữ", "Khác"])),
  role: z.preprocess((val) => {
    if (typeof val === "string") {
      const lower = val.trim().toLowerCase();
      if (lower === "vai chính" || lower === "main" || lower === "protagonist") return "Vai chính";
      if (lower === "vai phụ" || lower === "supporting") return "Vai phụ";
      if (lower === "phản diện" || lower === "antagonist" || lower === "villain") return "Phản diện";
      if (lower === "quần chúng" || lower === "extra" || lower === "background" || lower === "npc") return "Quần chúng";
    }
    return val;
  }, z.enum(["Vai chính", "Vai phụ", "Phản diện", "Quần chúng"])),
  description: z.string().trim().min(1).max(1000),
});

export const StoryboardAiResponseSchema = z.object({
  panels: z.array(StoryboardAiPanelSchema).min(1).max(8),
  characters: z.array(StoryboardAiCharacterSchema).optional(),
});

export const BubbleSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  fontSize: z.number().optional(),
});

export const PanelSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().positive(),
  scenePrompt: z.string().min(1),
  scenePromptDisplayEn: z.string().optional(),
  scenePromptDisplayVi: z.string().optional(),
  scenePromptDisplay: z.string().optional(),
  dialogue: z.string(),
  dialogueDisplayEn: z.string().optional(),
  dialogueDisplayVi: z.string().optional(),
  dialogueDisplay: z.string().optional(),
  characterIds: z.array(z.string().min(1)),
  status: z.enum(["draft", "queued", "generating", "success", "error"]),
  imageTone: z.string().min(1),
  imageUrl: z.string().optional(),
  errorMessage: z.string().optional(),
  bubbles: z.array(BubbleSchema),
  seed: z.number(),
  style: z.enum(["inherit", "manga", "webtoon", "western"]).optional(),
  usedModel: z.string().optional(),
  usedProvider: z
    .enum([
      "gemini",
      "imagen",
      "huggingface",
      "kaggle",
      "image-backend",
      "fallback",
    ])
    .optional(),
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  gender: z.enum(["Nam", "Nữ", "Khác"]).optional(),
  description: z.string().min(1),
  descriptionDisplayEn: z.string().optional(),
  descriptionDisplayVi: z.string().optional(),
  descriptionDisplay: z.string().optional(),
  color: z.string().min(1),
  priority: z.number().int().positive().optional(),
});

export const PageSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  orderIndex: z.number().int().positive(),
  title: z.string().min(1),
  panels: z.array(PanelSchema),
});

export const StoryboardResponseSchema = z.object({
  pages: z.array(PageSchema).min(1).max(24),
  characters: z.array(CharacterSchema).optional(),
  source: z.enum(["gemini", "fallback"]),
  warning: z.string().optional(),
  usedModel: z.string().optional(),
  usedProvider: z.enum(["gemini", "fallback"]).optional(),
});

export const GeneratePanelRequestSchema = z.object({
  panel: PanelSchema,
  characters: z.array(CharacterSchema).max(16),
});

export const GeneratePanelResponseSchema = z.object({
  panelId: z.string().min(1),
  imageUrl: z.string().min(1),
  source: z.enum(["image-backend", "fallback"]),
  warning: z.string().optional(),
  usedModel: z.string().optional(),
  usedProvider: z
    .enum([
      "gemini",
      "imagen",
      "huggingface",
      "kaggle",
      "image-backend",
      "fallback",
    ])
    .optional(),
});

export const KaggleImageJobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
]);

export const KaggleImageJobResponseSchema = z.object({
  jobId: z.string().min(1),
  panelId: z.string().min(1),
  status: KaggleImageJobStatusSchema,
  imageUrl: z.string().min(1).optional(),
  errorMessage: z.string().optional(),
  usedModel: z.string().optional(),
  usedProvider: z.literal("kaggle").optional(),
  retryAfterMs: z.number().int().positive().optional(),
});

export type StudioApiErrorCode = z.infer<typeof StudioApiErrorCodeSchema>;
export type StoryboardRequest = z.infer<typeof StoryboardRequestSchema>;
export type StoryboardAiResponse = z.infer<typeof StoryboardAiResponseSchema>;
export type StoryboardResponse = z.infer<typeof StoryboardResponseSchema>;
export type GeneratePanelRequest = z.infer<typeof GeneratePanelRequestSchema>;
export type GeneratePanelResponse = z.infer<typeof GeneratePanelResponseSchema>;
export type KaggleImageJobStatus = z.infer<
  typeof KaggleImageJobStatusSchema
>;
export type KaggleImageJobResponse = z.infer<
  typeof KaggleImageJobResponseSchema
>;
