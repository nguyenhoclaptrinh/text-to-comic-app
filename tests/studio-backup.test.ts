/**
 * @file studio-backup.test.ts
 * @description Unit tests for local-first backup import/export payloads.
 */

import { describe, expect, it } from "vitest";

import {
  createStudioBackupPayload,
  parseStudioBackup,
  serializeStudioBackup,
  STUDIO_BACKUP_APP_ID,
} from "@/lib/studio/backup";
import { createStudioSnapshot } from "@/lib/studio/persistence";
import {
  CHARACTERS_SEED,
  PAGES_SEED,
  PANELS_SEED,
  PROJECTS_SEED,
  SAMPLE_STORY,
} from "@/lib/studio/mock-data";

describe("studio backup payloads", () => {
  it("should serialize and parse a valid backup payload", () => {
    const exportedAt = new Date("2026-06-07T00:00:00.000Z");
    const snapshot = createTestSnapshot();
    const payload = createStudioBackupPayload(snapshot, exportedAt);

    expect(payload).toMatchObject({
      app: STUDIO_BACKUP_APP_ID,
      exportedAt: exportedAt.toISOString(),
      snapshot: expect.objectContaining({ storyTitle: "Snow Road Inn" }),
    });
    expect(parseStudioBackup(serializeStudioBackup(payload))).toEqual(payload);
  });

  it("should reject backups from another app", () => {
    expect(() =>
      parseStudioBackup(
        JSON.stringify({
          app: "other-app",
          exportedAt: new Date().toISOString(),
          snapshot: createTestSnapshot(),
        }),
      ),
    ).toThrow();
  });
});

function createTestSnapshot() {
  return createStudioSnapshot({
    projects: PROJECTS_SEED,
    activeProjectId: PROJECTS_SEED[0].id,
    activePageId: PAGES_SEED[0].id,
    characters: CHARACTERS_SEED,
    pages: PAGES_SEED,
    storyTitle: "Snow Road Inn",
    storyText: SAMPLE_STORY,
    selectedPanelId: PANELS_SEED[0].id,
    selectedBubbleId: PANELS_SEED[0].bubbles[0]?.id ?? "",
  });
}
