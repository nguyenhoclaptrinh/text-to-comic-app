/**
 * @file persistence.ts
 * @description Repository abstraction and localStorage adapter for studio snapshots.
 */

import {
  INTERRUPTED_GENERATION_ERROR,
  STUDIO_SNAPSHOT_VERSION,
  STUDIO_STORAGE_KEY,
} from "@/lib/studio/constants";
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
  loadSnapshot(): StudioSnapshot | null;
  saveSnapshot(snapshot: StudioSnapshot): void;
  clearSnapshot(): void;
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

  loadSnapshot() {
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

      return normalizeSnapshot(parsedSnapshot);
    } catch (error) {
      warnPersistenceIssue(StudioPersistenceErrorCode.INVALID_JSON, error);
      return null;
    }
  }

  saveSnapshot(snapshot: StudioSnapshot) {
    try {
      const cleanSnapshot = extractAndSaveBase64Images(snapshot);
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
}

export function createStudioSnapshot(
  snapshot: Omit<StudioSnapshot, "version">,
): StudioSnapshot {
  return {
    version: STUDIO_SNAPSHOT_VERSION,
    ...snapshot,
  };
}

export function normalizeSnapshot(snapshot: StudioSnapshot): StudioSnapshot {
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

  const normalizedPages = (pages || []).map((page) => ({
    ...page,
    panels: page.panels.map((panel) =>
      panel.status === "generating"
        ? {
            ...panel,
            status: "error" as const,
            errorMessage: INTERRUPTED_GENERATION_ERROR,
          }
        : panel,
    ),
  }));

  return {
    ...snapshot,
    activePageId: activePageId || `page-${snapshot.activeProjectId}-default`,
    pages: normalizedPages,
  };
}

function isStudioSnapshot(value: unknown): value is StudioSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === STUDIO_SNAPSHOT_VERSION &&
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

function extractAndSaveBase64Images(snapshot: StudioSnapshot): StudioSnapshot {
  if (typeof window === "undefined") {
    return snapshot;
  }

  const cleanPages = snapshot.pages.map((page) => {
    const cleanPanels = page.panels.map((panel) => {
      if (panel.imageUrl && panel.imageUrl.startsWith("data:image/")) {
        const key = `panel-image-${panel.id}`;
        import("@/lib/studio/indexeddb-storage").then(({ writeImage }) => {
          writeImage(key, panel.imageUrl!).catch((err) => {
            console.warn("[IndexedDB] Error saving image:", err);
          });
        });

        return {
          ...panel,
          imageUrl: `indexeddb://${key}`,
        };
      }
      return panel;
    });

    return {
      ...page,
      panels: cleanPanels,
    };
  });

  const cleanPanels = snapshot.panels
    ? snapshot.panels.map((panel) => {
        if (panel.imageUrl && panel.imageUrl.startsWith("data:image/")) {
          const key = `panel-image-${panel.id}`;
          import("@/lib/studio/indexeddb-storage").then(({ writeImage }) => {
            writeImage(key, panel.imageUrl!).catch((err) => {
              console.warn("[IndexedDB] Error saving image:", err);
            });
          });

          return {
            ...panel,
            imageUrl: `indexeddb://${key}`,
          };
        }
        return panel;
      })
    : undefined;

  return {
    ...snapshot,
    pages: cleanPages,
    panels: cleanPanels,
  };
}
