/**
 * @file export-plan.ts
 * @description Pure planning helpers for vertical PNG comic export.
 */

import type { Panel } from "@/lib/studio/types";

export const EXPORT_CANVAS_PADDING = 32;
export const EXPORT_PANEL_GAP = 28;
export const EXPORT_PANEL_WIDTH = 900;
export const EXPORT_PANEL_HEIGHT = 520;
export const NO_EXPORTABLE_PANELS_ERROR =
  "Hãy vẽ ít nhất một khung trước khi xuất PNG.";

export type ComicExportPlan = {
  filename: string;
  panels: Panel[];
  missingImages: number;
  width: number;
  height: number;
};

export function createComicExportPlan({
  projectTitle,
  panels,
  includeMissingPanels = false,
  now = new Date(),
}: {
  projectTitle: string;
  panels: Panel[];
  includeMissingPanels?: boolean;
  now?: Date;
}): ComicExportPlan {
  const exportPanels = getOrderedExportPanels(panels, includeMissingPanels);

  if (exportPanels.length === 0) {
    throw new Error(NO_EXPORTABLE_PANELS_ERROR);
  }

  return {
    filename: createExportFilename(projectTitle, now),
    panels: exportPanels,
    missingImages: getMissingImageCount(panels),
    ...calculateExportCanvasSize(exportPanels.length),
  };
}

export function getOrderedExportPanels(
  panels: Panel[],
  includeMissingPanels: boolean,
) {
  return [...panels]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .filter((panel) => includeMissingPanels || panel.status === "success");
}

export function getMissingImageCount(panels: Panel[]) {
  return panels.filter((panel) => panel.status !== "success").length;
}

export function calculateExportCanvasSize(panelCount: number) {
  return {
    width: EXPORT_PANEL_WIDTH + EXPORT_CANVAS_PADDING * 2,
    height:
      EXPORT_CANVAS_PADDING * 2 +
      panelCount * EXPORT_PANEL_HEIGHT +
      Math.max(panelCount - 1, 0) * EXPORT_PANEL_GAP,
  };
}

export function createExportFilename(projectTitle: string, now: Date) {
  const date = now.toISOString().slice(0, 10);
  const slug = projectTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${slug || "comic-export"}-${date}.png`;
}
