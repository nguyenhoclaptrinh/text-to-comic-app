/**
 * @file backup.ts
 * @description Import/export helpers for local-first production backup files.
 */

import { z } from "zod";

import { STUDIO_SNAPSHOT_VERSION } from "@/lib/studio/constants";
import { StudioSnapshotSchema } from "@/lib/studio/snapshot-schema";
import type { StudioSnapshot } from "@/lib/studio/types";

export const STUDIO_BACKUP_APP_ID = "text-to-comic";

export type StudioBackupPayload = {
  app: typeof STUDIO_BACKUP_APP_ID;
  exportedAt: string;
  snapshot: StudioSnapshot;
};

const StudioBackupPayloadSchema = z.object({
  app: z.literal(STUDIO_BACKUP_APP_ID),
  exportedAt: z.string().min(1),
  snapshot: StudioSnapshotSchema,
});

export function createStudioBackupPayload(
  snapshot: StudioSnapshot,
  now = new Date(),
): StudioBackupPayload {
  return {
    app: STUDIO_BACKUP_APP_ID,
    exportedAt: now.toISOString(),
    snapshot: {
      ...snapshot,
      version: STUDIO_SNAPSHOT_VERSION,
      savedAt: snapshot.savedAt || now.toISOString(),
    },
  };
}

export function serializeStudioBackup(payload: StudioBackupPayload) {
  return JSON.stringify(payload, null, 2);
}

export function parseStudioBackup(raw: string): StudioBackupPayload {
  const parsed: unknown = JSON.parse(raw);
  return StudioBackupPayloadSchema.parse(parsed);
}
