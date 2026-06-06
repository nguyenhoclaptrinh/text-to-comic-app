/**
 * @file persistence.ts
 * @description Repository abstraction and localStorage adapter for studio snapshots.
 */

import {
  STUDIO_SNAPSHOT_VERSION,
  STUDIO_STORAGE_KEY,
} from "@/lib/studio/constants";
import {
  migrateStudioSnapshot,
  normalizeCurrentSnapshot,
} from "@/lib/studio/snapshot-migrations";
import type {
  Character,
  Page,
  Panel,
  Project,
  StudioSnapshot,
} from "@/lib/studio/types";

export type KeyValueStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export interface StudioRepository {
  loadSnapshot(): Promise<StudioSnapshot | null> | StudioSnapshot | null;
  saveSnapshot(snapshot: StudioSnapshot): Promise<void> | void;
  clearSnapshot(): Promise<void> | void;
  exportSnapshot?(): Promise<StudioSnapshot | null> | StudioSnapshot | null;
  importSnapshot?(snapshot: StudioSnapshot): Promise<void> | void;
}

export enum StudioPersistenceErrorCode {
  INVALID_JSON = "INVALID_JSON",
  INVALID_SNAPSHOT = "INVALID_SNAPSHOT",
  STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE",
}

export class LocalStorageStudioRepository implements StudioRepository {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key = STUDIO_STORAGE_KEY,
  ) {}

  async loadSnapshot() {
    try {
      const rawSnapshot = this.storage.getItem(this.key);
      if (!rawSnapshot) {
        return null;
      }

      const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
      if (!isStudioSnapshot(parsedSnapshot)) {
        warnPersistenceIssue(
          StudioPersistenceErrorCode.INVALID_SNAPSHOT,
          parsedSnapshot,
        );
        return null;
      }

      return migrateStudioSnapshot(parsedSnapshot);
    } catch (error) {
      warnPersistenceIssue(StudioPersistenceErrorCode.INVALID_JSON, error);
      return null;
    }
  }

  async saveSnapshot(snapshot: StudioSnapshot) {
    try {
      const cleanSnapshot = await extractAndSaveBase64Images(snapshot);
      this.storage.setItem(this.key, JSON.stringify(cleanSnapshot));
    } catch (error) {
      warnPersistenceIssue(
        StudioPersistenceErrorCode.STORAGE_UNAVAILABLE,
        error,
      );
    }
  }

  clearSnapshot() {
    this.storage.removeItem(this.key);
  }

  exportSnapshot() {
    return this.loadSnapshot();
  }

  importSnapshot(snapshot: StudioSnapshot) {
    return this.saveSnapshot(normalizeSnapshot(snapshot));
  }
}

export function createStudioSnapshot(
  snapshot: Omit<StudioSnapshot, "version">,
): StudioSnapshot {
  return {
    version: STUDIO_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    ...snapshot,
  };
}

export function normalizeSnapshot(snapshot: StudioSnapshot): StudioSnapshot {
  return normalizeCurrentSnapshot(snapshot);
}

function isStudioSnapshot(value: unknown): value is StudioSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.version === "number" &&
    value.version > 0 &&
    value.version <= STUDIO_SNAPSHOT_VERSION &&
    isProjectArray(value.projects) &&
    typeof value.activeProjectId === "string" &&
    isCharacterArray(value.characters) &&
    (isPageArray(value.pages) || isPanelArray(value.panels)) &&
    typeof value.storyTitle === "string" &&
    typeof value.storyText === "string" &&
    typeof value.selectedPanelId === "string" &&
    typeof value.selectedBubbleId === "string"
  );
}

function isProjectArray(value: unknown): value is Project[] {
  return Array.isArray(value) && value.length > 0 && value.every(isProject);
}

function isCharacterArray(value: unknown): value is Character[] {
  return Array.isArray(value) && value.every(isCharacter);
}

function isPageArray(value: unknown): value is Page[] {
  return Array.isArray(value) && value.length > 0 && value.every(isPage);
}

function isPage(value: unknown): value is Page {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.orderIndex === "number" &&
    typeof value.title === "string" &&
    Array.isArray(value.panels) &&
    value.panels.every(isPanel)
  );
}

function isPanelArray(value: unknown): value is Panel[] {
  return Array.isArray(value) && value.length > 0 && value.every(isPanel);
}

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.panelCount === "number"
  );
}

function isCharacter(value: unknown): value is Character {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    typeof value.description === "string" &&
    typeof value.color === "string"
  );
}

function isPanel(value: unknown): value is Panel {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.orderIndex === "number" &&
    typeof value.scenePrompt === "string" &&
    typeof value.dialogue === "string" &&
    Array.isArray(value.characterIds) &&
    typeof value.status === "string" &&
    typeof value.imageTone === "string" &&
    optionalString(value.imageUrl) &&
    optionalString(value.errorMessage) &&
    Array.isArray(value.bubbles)
  );
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function warnPersistenceIssue(
  code: StudioPersistenceErrorCode,
  originalError: unknown,
) {
  console.warn("[StudioPersistence]", code, originalError);
}

async function extractAndSaveBase64Images(
  snapshot: StudioSnapshot,
): Promise<StudioSnapshot> {
  if (typeof window === "undefined") {
    return snapshot;
  }

  const { writeImage } = await import("@/lib/studio/indexeddb-storage");

  const cleanPages = await Promise.all(
    snapshot.pages.map(async (page) => {
      const cleanPanels = await Promise.all(
        page.panels.map(async (panel) => {
          if (panel.imageUrl && panel.imageUrl.startsWith("data:image/")) {
            const key = `panel-image-${panel.id}`;
            try {
              await writeImage(key, panel.imageUrl!);
              return {
                ...panel,
                imageUrl: `indexeddb://${key}`,
              };
            } catch (err) {
              console.warn("[IndexedDB] Error saving image:", err);
            }
          }
          return panel;
        }),
      );

      return {
        ...page,
        panels: cleanPanels,
      };
    }),
  );

  const cleanPanels = snapshot.panels
    ? await Promise.all(
        snapshot.panels.map(async (panel) => {
          if (panel.imageUrl && panel.imageUrl.startsWith("data:image/")) {
            const key = `panel-image-${panel.id}`;
            try {
              await writeImage(key, panel.imageUrl!);
              return {
                ...panel,
                imageUrl: `indexeddb://${key}`,
              };
            } catch (err) {
              console.warn("[IndexedDB] Error saving image:", err);
            }
          }
          return panel;
        }),
      )
    : undefined;

  return {
    ...snapshot,
    pages: cleanPages,
    panels: cleanPanels,
  };
}
