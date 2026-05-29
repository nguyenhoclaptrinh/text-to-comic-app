/**
 * @file studio-persistence.test.ts
 * @description Unit tests for studio snapshot persistence.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  INTERRUPTED_GENERATION_ERROR,
  STUDIO_SNAPSHOT_VERSION,
} from "@/lib/studio/constants";
import {
  createStudioSnapshot,
  LocalStorageStudioRepository,
  type KeyValueStorage,
} from "@/lib/studio/persistence";
import {
  CHARACTERS_SEED,
  PANELS_SEED,
  PROJECTS_SEED,
  SAMPLE_STORY,
} from "@/lib/studio/mock-data";

class MemoryStorage implements KeyValueStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

describe("LocalStorageStudioRepository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should use the current snapshot version in factory output", () => {
    expect(createTestSnapshot().version).toBe(STUDIO_SNAPSHOT_VERSION);
  });

  it("should save and load a valid studio snapshot", async () => {
    const repository = new LocalStorageStudioRepository(
      new MemoryStorage(),
      "test-key",
    );
    const snapshot = createTestSnapshot();

    await repository.saveSnapshot(snapshot);

    expect(await repository.loadSnapshot()).toEqual(snapshot);
  });

  it("should clear a saved snapshot", async () => {
    const repository = new LocalStorageStudioRepository(
      new MemoryStorage(),
      "test-key",
    );

    await repository.saveSnapshot(createTestSnapshot());
    repository.clearSnapshot();

    expect(await repository.loadSnapshot()).toBeNull();
  });

  it("should return null and warn when stored JSON is invalid", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageStudioRepository(storage, "test-key");
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    storage.setItem("test-key", "{not-json");

    expect(await repository.loadSnapshot()).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[StudioPersistence]",
      "INVALID_JSON",
      expect.any(SyntaxError),
    );
  });

  it("should reject snapshots from an unsupported version", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageStudioRepository(storage, "test-key");
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    storage.setItem(
      "test-key",
      JSON.stringify({ ...createTestSnapshot(), version: 999 }),
    );

    expect(await repository.loadSnapshot()).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[StudioPersistence]",
      "INVALID_SNAPSHOT",
      expect.objectContaining({ version: 999 }),
    );
  });

  it("should convert interrupted generation states into retryable errors", async () => {
    const repository = new LocalStorageStudioRepository(
      new MemoryStorage(),
      "test-key",
    );
    const activeProjectId = PROJECTS_SEED[0].id;
    const activePageId = `page-${activeProjectId}-default`;
    const snapshot = createTestSnapshot({
      pages: [
        {
          id: activePageId,
          projectId: activeProjectId,
          orderIndex: 1,
          title: "Page 1",
          panels: [
            { ...PANELS_SEED[0], status: "generating" },
            ...PANELS_SEED.slice(1),
          ],
        },
      ],
    });

    await repository.saveSnapshot(snapshot);

    const loaded = await repository.loadSnapshot();
    expect(loaded?.pages[0].panels[0]).toMatchObject({
      status: "error",
      errorMessage: INTERRUPTED_GENERATION_ERROR,
    });
  });
});

function createTestSnapshot(
  overrides: Partial<ReturnType<typeof createStudioSnapshot>> = {},
) {
  const activeProjectId = PROJECTS_SEED[0].id;
  const activePageId = `page-${activeProjectId}-default`;
  return createStudioSnapshot({
    projects: PROJECTS_SEED,
    activeProjectId,
    activePageId,
    characters: CHARACTERS_SEED,
    pages: [
      {
        id: activePageId,
        projectId: activeProjectId,
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
  });
}
