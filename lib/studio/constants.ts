/**
 * @file constants.ts
 * @description Centralized constants for studio UI timing, layout, and status copy.
 */

import type { PanelStatus } from "@/lib/studio/types";

export const GENERATION_DELAY_MS = 850;
export const EXPORT_PROGRESS_INTERVAL_MS = 160;
export const EXPORT_PROGRESS_STEP = 8;
export const EXPORT_PROGRESS_MAX = 92;

export const BUBBLE_BOUNDARY_PADDING = 10;
export const DEFAULT_BUBBLE_X = 42;
export const DEFAULT_BUBBLE_Y = 42;
export const DEFAULT_BUBBLE_WIDTH = 180;
export const DEFAULT_BUBBLE_HEIGHT = 58;
export const GENERATED_BUBBLE_X = 34;
export const GENERATED_BUBBLE_Y = 26;
export const GENERATED_BUBBLE_WIDTH = 188;
export const BUBBLE_TEXT_MAX_LENGTH = 72;
export const STORY_EXCERPT_MAX_LENGTH = 84;
export const STUDIO_STORAGE_KEY = "comic-ai-studio:snapshot";
export const STUDIO_SNAPSHOT_VERSION = 1;
export const INTERRUPTED_GENERATION_ERROR =
  "Generation was interrupted by reload. Please retry this panel.";

export const STATUS_COPY: Record<PanelStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  success: "Done",
  error: "Error",
};

export const STATUS_CLASS: Record<PanelStatus, string> = {
  draft: "border-zinc-700 bg-zinc-900 text-zinc-300",
  generating: "border-violet-400/40 bg-violet-500/15 text-violet-200",
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  error: "border-red-400/40 bg-red-500/15 text-red-200",
};
