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
});

export const StoryboardAiPanelSchema = z.object({
  orderIndex: z.number().int().positive(),
  scenePrompt: z.string().trim().min(8).max(1200),
  characters: z.array(z.string().trim().min(1).max(80)).max(8),
  dialogue: z.string().trim().max(800),
});

export const StoryboardAiResponseSchema = z.object({
  panels: z.array(StoryboardAiPanelSchema).min(1).max(8),
});

export const BubbleSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const PanelSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().positive(),
  scenePrompt: z.string().min(1),
  dialogue: z.string(),
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

export const PageSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  orderIndex: z.number().int().positive(),
  title: z.string().min(1),
  panels: z.array(PanelSchema),
});

export const StoryboardResponseSchema = z.object({
  pages: z.array(PageSchema).min(1).max(24),
  source: z.enum(["gemini", "fallback"]),
  warning: z.string().optional(),
  usedModel: z.string().optional(),
  usedProvider: z.enum(["gemini", "fallback"]).optional(),
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  color: z.string().min(1),
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
