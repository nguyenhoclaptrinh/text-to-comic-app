/**
 * @file studio-snapshot-migrations.test.ts
 * @description Unit tests for versioned studio snapshot migrations.
 */

import { describe, expect, it } from "vitest";

import { STUDIO_SNAPSHOT_VERSION } from "@/lib/studio/constants";
import {
  migrateStudioSnapshot,
  normalizeCurrentSnapshot,
} from "@/lib/studio/snapshot-migrations";
import {
  CHARACTERS_SEED,
  PANELS_SEED,
  PROJECTS_SEED,
  SAMPLE_STORY,
} from "@/lib/studio/mock-data";
import type { StudioSnapshot } from "@/lib/studio/types";

describe("studio snapshot migrations", () => {
  it("should normalize legacy top-level panels into a default page", () => {
    const legacySnapshot = createSnapshot({
      pages: [],
      panels: PANELS_SEED,
      activePageId: "",
    });

    const migrated = migrateStudioSnapshot(legacySnapshot);

    expect(migrated?.pages).toHaveLength(1);
    expect(migrated?.pages[0]).toMatchObject({
      id: `page-${legacySnapshot.activeProjectId}-default`,
      panels: PANELS_SEED,
    });
  });

  it("should convert queued or generating panels into retryable errors", () => {
    const snapshot = createSnapshot({
      pages: [
        {
          id: "page-1",
          projectId: "project-1",
          orderIndex: 1,
          title: "Page 1",
          panels: [
            { ...PANELS_SEED[0], status: "queued" },
            { ...PANELS_SEED[1], status: "generating" },
          ],
        },
      ],
    });

    expect(normalizeCurrentSnapshot(snapshot).pages[0].panels).toEqual([
      expect.objectContaining({ status: "error" }),
      expect.objectContaining({ status: "error" }),
    ]);
  });

  it("should reject future snapshot versions", () => {
    expect(
      migrateStudioSnapshot(
        createSnapshot({ version: STUDIO_SNAPSHOT_VERSION + 1 }),
      ),
    ).toBeNull();
  });
});

function createSnapshot(
  overrides: Partial<StudioSnapshot> = {},
): StudioSnapshot {
  return {
    version: STUDIO_SNAPSHOT_VERSION,
    projects: PROJECTS_SEED,
    activeProjectId: PROJECTS_SEED[0].id,
    activePageId: "page-1",
    characters: CHARACTERS_SEED,
    pages: [
      {
        id: "page-1",
        projectId: PROJECTS_SEED[0].id,
        orderIndex: 1,
        title: "Page 1",
        panels: PANELS_SEED,
      },
    ],
    storyTitle: "Snow Road Inn",
    storyText: SAMPLE_STORY,
    selectedPanelId: PANELS_SEED[0].id,
    selectedBubbleId: PANELS_SEED[0].bubbles[0]?.id ?? "",
    ...overrides,
  };
}
