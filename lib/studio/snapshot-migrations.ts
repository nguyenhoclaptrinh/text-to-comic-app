/**
 * @file snapshot-migrations.ts
 * @description Versioned migration registry for local-first studio snapshots.
 */

import {
  INTERRUPTED_GENERATION_ERROR,
  STUDIO_SNAPSHOT_VERSION,
} from "@/lib/studio/constants";
import type { Page, Project, StudioSnapshot } from "@/lib/studio/types";

export type SnapshotMigration = {
  fromVersion: number;
  toVersion: number;
  migrate: (snapshot: StudioSnapshot) => StudioSnapshot;
};

export const SNAPSHOT_MIGRATIONS: SnapshotMigration[] = [
  {
    fromVersion: 1,
    toVersion: STUDIO_SNAPSHOT_VERSION,
    migrate: normalizeCurrentSnapshot,
  },
];

export function migrateStudioSnapshot(
  snapshot: StudioSnapshot,
): StudioSnapshot | null {
  if (snapshot.version > STUDIO_SNAPSHOT_VERSION) {
    return null;
  }

  let migrated = snapshot;
  for (const migration of SNAPSHOT_MIGRATIONS) {
    if (migrated.version === migration.fromVersion) {
      migrated = migration.migrate(migrated);
    }
  }

  return migrated.version === STUDIO_SNAPSHOT_VERSION
    ? normalizeCurrentSnapshot(migrated)
    : null;
}

export function normalizeCurrentSnapshot(
  snapshot: StudioSnapshot,
): StudioSnapshot {
  let pages = snapshot.pages;
  let activePageId = snapshot.activePageId;

  if ((!pages || pages.length === 0) && snapshot.panels) {
    activePageId = `page-${snapshot.activeProjectId}-default`;
    pages = [
      {
        id: activePageId,
        projectId: snapshot.activeProjectId,
        orderIndex: 1,
        title: "Page 1",
        panels: snapshot.panels,
      },
    ];
  }

  return {
    ...snapshot,
    version: STUDIO_SNAPSHOT_VERSION,
    savedAt: snapshot.savedAt || new Date(0).toISOString(),
    activePageId: activePageId || `page-${snapshot.activeProjectId}-default`,
    pages: normalizePages(pages || []),
    projects: normalizeProjects(snapshot.projects || []),
  };
}

function normalizePages(pages: Page[]): Page[] {
  return pages.map((page) => ({
    ...page,
    panels: page.panels.map((panel) => {
      const basePanel = {
        ...panel,
        style: panel.style || "inherit",
      };

      return panel.status === "generating" || panel.status === "queued"
        ? {
            ...basePanel,
            status: "error" as const,
            errorMessage: INTERRUPTED_GENERATION_ERROR,
          }
        : basePanel;
    }),
  }));
}

function normalizeProjects(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    style: project.style || "webtoon",
  }));
}
