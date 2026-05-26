/**
 * @file useStudioPersistence.ts
 * @description Hydrates and persists studio state through a repository adapter.
 */

import { useEffect, useRef } from "react";

import { LocalStorageStudioRepository } from "@/lib/studio/persistence";
import { SupabaseStudioRepository } from "@/lib/studio/supabase-repository";
import type { StudioSnapshot } from "@/lib/studio/types";

type UseStudioPersistenceParams = {
  snapshot: StudioSnapshot;
  onSnapshotLoaded: (snapshot: StudioSnapshot) => void;
};

export function useStudioPersistence({
  snapshot,
  onSnapshotLoaded,
}: UseStudioPersistenceParams) {
  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (!isHydratedRef.current) {
      return;
    }

    createBrowserRepository()?.saveSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const repository = createBrowserRepository();
    const persistedSnapshot = repository?.loadSnapshot();
    if (persistedSnapshot) {
      resolveIndexedDbImages(persistedSnapshot).then((resolved) => {
        onSnapshotLoaded(resolved);
      });
    }
    isHydratedRef.current = true;
  }, [onSnapshotLoaded]);
}

async function resolveIndexedDbImages(snapshot: StudioSnapshot): Promise<StudioSnapshot> {
  const { readImage } = await import("@/lib/studio/indexeddb-storage");
  const resolvedPanels = await Promise.all(
    snapshot.panels.map(async (panel) => {
      if (panel.imageUrl && panel.imageUrl.startsWith("indexeddb://")) {
        const key = panel.imageUrl.replace("indexeddb://", "");
        try {
          const base64 = await readImage(key);
          if (base64) {
            return {
              ...panel,
              imageUrl: base64,
            };
          }
        } catch (err) {
          console.warn("[IndexedDB] Error resolving image:", err);
        }
      }
      return panel;
    })
  );

  return {
    ...snapshot,
    panels: resolvedPanels,
  };
}

function createBrowserRepository() {
  if (typeof window === "undefined") {
    return null;
  }

  const localRepo = new LocalStorageStudioRepository(window.localStorage);
  return new SupabaseStudioRepository(localRepo);
}
