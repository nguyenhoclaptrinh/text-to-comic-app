/**
 * @file selectors.ts
 * @description Derived data selectors for the studio document model.
 */

import type {
  GenerationSummary,
  Page,
  Panel,
  Project,
} from "@/lib/studio/types";

export function getPanelsForProject(pages: Page[], projectId: string): Panel[] {
  return pages
    .filter((page) => page.projectId === projectId)
    .flatMap((page) => page.panels)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function countPanelsForProject(pages: Page[], projectId: string) {
  return getPanelsForProject(pages, projectId).length;
}

export function syncProjectPanelCounts(
  projects: Project[],
  pages: Page[],
): Project[] {
  return projects.map((project) => ({
    ...project,
    panelCount: countPanelsForProject(pages, project.id),
  }));
}

export function countMissingImages(pages: Page[], projectId?: string) {
  return getRelevantPanels(pages, projectId).filter(
    (panel) => panel.status !== "success",
  ).length;
}

export function summarizeGeneration(
  pages: Page[],
  projectId?: string,
): GenerationSummary {
  return getRelevantPanels(pages, projectId).reduce(
    (summary, panel) => ({
      total: summary.total + 1,
      done: summary.done + (panel.status === "success" ? 1 : 0),
      errors: summary.errors + (panel.status === "error" ? 1 : 0),
    }),
    { done: 0, errors: 0, total: 0 },
  );
}

function getRelevantPanels(pages: Page[], projectId?: string) {
  return projectId
    ? pages
        .filter((page) => page.projectId === projectId)
        .flatMap((page) => page.panels)
    : pages.flatMap((page) => page.panels);
}
