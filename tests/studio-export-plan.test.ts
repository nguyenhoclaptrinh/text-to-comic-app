/**
 * @file studio-export-plan.test.ts
 * @description Unit tests for vertical PNG export planning.
 */

import { describe, expect, it } from "vitest";

import {
  calculateExportCanvasSize,
  createComicExportPlan,
  createExportFilename,
  EXPORT_CANVAS_PADDING,
  EXPORT_PANEL_GAP,
  EXPORT_PANEL_HEIGHT,
  EXPORT_PANEL_WIDTH,
  getMissingImageCount,
  getOrderedExportPanels,
  NO_EXPORTABLE_PANELS_ERROR,
} from "@/lib/studio/export-plan";
import { PANELS_SEED } from "@/lib/studio/mock-data";

describe("comic export plan", () => {
  it("should sort panels by order index and export only generated panels by default", () => {
    const panels = [PANELS_SEED[2], PANELS_SEED[1], PANELS_SEED[0]];

    expect(
      getOrderedExportPanels(panels, false).map((panel) => panel.id),
    ).toEqual(["panel-1"]);
  });

  it("should include missing panels when partial filtering is disabled", () => {
    expect(getOrderedExportPanels(PANELS_SEED, true)).toHaveLength(3);
  });

  it("should count panels without successful images", () => {
    expect(getMissingImageCount(PANELS_SEED)).toBe(2);
  });

  it("should calculate vertical canvas dimensions from panel count", () => {
    expect(calculateExportCanvasSize(3)).toEqual({
      width: EXPORT_PANEL_WIDTH + EXPORT_CANVAS_PADDING * 2,
      height:
        EXPORT_CANVAS_PADDING * 2 +
        EXPORT_PANEL_HEIGHT * 3 +
        EXPORT_PANEL_GAP * 2,
    });
  });

  it("should create stable safe export filenames", () => {
    expect(
      createExportFilename(
        "Snow Road Inn: Chapter 1!",
        new Date("2026-05-17T00:00:00.000Z"),
      ),
    ).toBe("snow-road-inn-chapter-1-2026-05-17.png");
  });

  it("should create an export plan for available generated panels", () => {
    const plan = createComicExportPlan({
      projectTitle: "Snow Road Inn",
      panels: PANELS_SEED,
      now: new Date("2026-05-17T00:00:00.000Z"),
    });

    expect(plan).toMatchObject({
      filename: "snow-road-inn-2026-05-17.png",
      missingImages: 2,
      width: EXPORT_PANEL_WIDTH + EXPORT_CANVAS_PADDING * 2,
    });
    expect(plan.panels).toHaveLength(1);
  });

  it("should reject export when no panel has a generated image", () => {
    const panels = PANELS_SEED.map((panel) => ({
      ...panel,
      status: "draft" as const,
    }));

    expect(() =>
      createComicExportPlan({ projectTitle: "Draft", panels }),
    ).toThrow(NO_EXPORTABLE_PANELS_ERROR);
  });
});
