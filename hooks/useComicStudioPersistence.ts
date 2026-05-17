/**
 * @file useComicStudioPersistence.ts
 * @description Adapts comic studio state setters to snapshot persistence.
 */

import { useCallback, useMemo } from "react";

import { useStudioPersistence } from "@/hooks/useStudioPersistence";
import { createStudioSnapshot } from "@/lib/studio/persistence";
import type {
  Character,
  Panel,
  Project,
  StudioSnapshot,
} from "@/lib/studio/types";

type PersistedStudioState = Omit<StudioSnapshot, "version">;

type StudioHydrationSetters = {
  setProjects: (projects: Project[]) => void;
  setActiveProjectId: (projectId: string) => void;
  setCharacters: (characters: Character[]) => void;
  setPanels: (panels: Panel[]) => void;
  setStoryTitle: (title: string) => void;
  setStoryText: (text: string) => void;
  setSelectedPanelId: (panelId: string) => void;
  setSelectedBubbleId: (bubbleId: string) => void;
};

export function useComicStudioPersistence(
  state: PersistedStudioState,
  setters: StudioHydrationSetters,
) {
  const {
    projects,
    activeProjectId,
    characters,
    panels,
    storyTitle,
    storyText,
    selectedPanelId,
    selectedBubbleId,
  } = state;
  const {
    setProjects,
    setActiveProjectId,
    setCharacters,
    setPanels,
    setStoryTitle,
    setStoryText,
    setSelectedPanelId,
    setSelectedBubbleId,
  } = setters;

  const snapshot = useMemo(
    () =>
      createStudioSnapshot({
        projects,
        activeProjectId,
        characters,
        panels,
        storyTitle,
        storyText,
        selectedPanelId,
        selectedBubbleId,
      }),
    [
      activeProjectId,
      characters,
      panels,
      projects,
      selectedBubbleId,
      selectedPanelId,
      storyText,
      storyTitle,
    ],
  );

  const hydrateFromSnapshot = useCallback(
    (persistedSnapshot: StudioSnapshot) => {
      setProjects(persistedSnapshot.projects);
      setActiveProjectId(persistedSnapshot.activeProjectId);
      setCharacters(persistedSnapshot.characters);
      setPanels(persistedSnapshot.panels);
      setStoryTitle(persistedSnapshot.storyTitle);
      setStoryText(persistedSnapshot.storyText);
      setSelectedPanelId(persistedSnapshot.selectedPanelId);
      setSelectedBubbleId(persistedSnapshot.selectedBubbleId);
    },
    [
      setActiveProjectId,
      setCharacters,
      setPanels,
      setProjects,
      setSelectedBubbleId,
      setSelectedPanelId,
      setStoryText,
      setStoryTitle,
    ],
  );

  useStudioPersistence({ snapshot, onSnapshotLoaded: hydrateFromSnapshot });
}
