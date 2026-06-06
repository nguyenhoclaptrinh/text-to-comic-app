/**
 * @file studio-selectors.test.ts
 * @description Unit tests for derived studio data selectors.
 */

import { describe, expect, it } from "vitest";

import {
  countMissingImages,
  countPanelsForProject,
  getPanelsForProject,
  summarizeGeneration,
  syncProjectPanelCounts,
} from "@/lib/studio/selectors";
import { PAGES_SEED, PANELS_SEED, PROJECTS_SEED } from "@/lib/studio/mock-data";

describe("studio selectors", () => {
  it("should derive panels and counts for the active project", () => {
    expect(getPanelsForProject(PAGES_SEED, PROJECTS_SEED[0].id)).toHaveLength(
      3,
    );
    expect(countPanelsForProject(PAGES_SEED, PROJECTS_SEED[0].id)).toBe(3);
    expect(countPanelsForProject(PAGES_SEED, "missing-project")).toBe(0);
  });

  it("should summarize image generation by project", () => {
    expect(summarizeGeneration(PAGES_SEED, PROJECTS_SEED[0].id)).toEqual({
      done: 1,
      errors: 1,
      total: 3,
    });
    expect(countMissingImages(PAGES_SEED, PROJECTS_SEED[0].id)).toBe(2);
  });

  it("should sync project panel counts from pages", () => {
    const projects = syncProjectPanelCounts(
      [{ ...PROJECTS_SEED[0], panelCount: 99 }],
      [
        {
          ...PAGES_SEED[0],
          panels: PANELS_SEED.slice(0, 2),
        },
      ],
    );

    expect(projects[0]).toMatchObject({ panelCount: 2 });
  });
});
