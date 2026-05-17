/**
 * @file useStudioPersistence.ts
 * @description Hydrates and persists studio state through a repository adapter.
 */

import { useEffect, useRef } from "react";

import { LocalStorageStudioRepository } from "@/lib/studio/persistence";
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
      onSnapshotLoaded(persistedSnapshot);
    }
    isHydratedRef.current = true;
  }, [onSnapshotLoaded]);
}

function createBrowserRepository() {
  if (typeof window === "undefined") {
    return null;
  }

  return new LocalStorageStudioRepository(window.localStorage);
}
