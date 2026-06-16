/**
 * @file constants.ts
 * @description Centralized constants for studio UI timing, layout, and status copy.
 */

import type { PanelStatus } from "@/lib/studio/types";

export const GENERATION_DELAY_MS = 850;
export const EXPORT_PROGRESS_INTERVAL_MS = 160;
export const EXPORT_PROGRESS_STEP = 8;
export const EXPORT_PROGRESS_MAX = 92;

export const BUBBLE_BOUNDARY_PADDING = 2; // % padding
export const DEFAULT_BUBBLE_X = 15; // %
export const DEFAULT_BUBBLE_Y = 15; // %
export const DEFAULT_BUBBLE_WIDTH = 35; // %
export const DEFAULT_BUBBLE_HEIGHT = 18; // %
export const GENERATED_BUBBLE_X = 15; // %
export const GENERATED_BUBBLE_Y = 10; // %
export const GENERATED_BUBBLE_WIDTH = 40; // %
export const BUBBLE_TEXT_MAX_LENGTH = 72;
export const STORY_EXCERPT_MAX_LENGTH = 84;
export const STUDIO_STORAGE_KEY = "comic-ai-studio:snapshot";
export const STUDIO_SNAPSHOT_VERSION = 1;
export const INTERRUPTED_GENERATION_ERROR =
  "Quá trình vẽ ảnh bị gián đoạn khi tải lại trang. Bạn có thể thử vẽ lại khung này.";

export const STATUS_COPY: Record<PanelStatus, string> = {
  draft: "Chưa vẽ",
  queued: "Đang chờ",
  generating: "Đang vẽ",
  success: "Đã vẽ",
  error: "Cần thử lại",
};

export const STATUS_CLASS: Record<PanelStatus, string> = {
  draft: "border-border-main bg-surface-elevated text-text-secondary",
  queued: "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  generating: "border-violet-400/30 bg-violet-500/10 text-violet-700 dark:text-violet-200",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  error: "border-red-400/30 bg-red-500/10 text-red-650 dark:text-red-200",
};

export const COMIC_STYLES = {
  webtoon: "Modern Webtoon (Color)",
  manga: "Classic Manga (B&W)",
  western: "Western Comic Book",
} as const;

export const COMIC_STYLE_MODIFIERS = {
  webtoon:
    "Modern webtoon style, vibrant digital color, clean lineart, soft shading, manhwa aesthetic.",
  manga:
    "Manga style, black and white, hand-drawn ink lineart, detailed screentones, classic Japanese manga aesthetic.",
  western:
    "Western comic book style, bold inks, cel shading, classic American comic book aesthetic, retro pop art style.",
} as const;
