/**
 * @file useComicStudioPersistence.ts
 * @description Adapts comic studio state setters to snapshot persistence with multi-page support.
 */

import { useCallback, useMemo } from "react";

import { useStudioPersistence } from "@/hooks/useStudioPersistence";
import { createStudioSnapshot } from "@/lib/studio/persistence";
import type {
  Character,
  Page,
  Project,
  StudioSnapshot,
} from "@/lib/studio/types";

type PersistedStudioState = Omit<StudioSnapshot, "version">;

type StudioHydrationSetters = {
  setProjects: (projects: Project[]) => void;
  setActiveProjectId: (projectId: string) => void;
  setCharacters: (characters: Character[]) => void;
  setPages: (pages: Page[]) => void;
  setActivePageId: (activePageId: string) => void;
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
    pages,
    activePageId,
    storyTitle,
    storyText,
    selectedPanelId,
    selectedBubbleId,
  } = state;
  const {
    setProjects,
    setActiveProjectId,
    setCharacters,
    setPages,
    setActivePageId,
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
        pages,
        activePageId,
        storyTitle,
        storyText,
        selectedPanelId,
        selectedBubbleId,
      }),
    [
      activeProjectId,
      characters,
      pages,
      activePageId,
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

      const healedPages = (persistedSnapshot.pages || []).map((page) => ({
        ...page,
        panels: (page.panels || []).map((panel) => {
          if (
            panel.dialogue &&
            panel.dialogue.trim() &&
            (!panel.bubbles || panel.bubbles.length === 0)
          ) {
            const [, text = panel.dialogue] = panel.dialogue.split(":");
            const cleanText = text.trim().slice(0, 150);
            if (cleanText) {
              return {
                ...panel,
                bubbles: [
                  {
                    id: crypto.randomUUID(),
                    text: cleanText,
                    x: 35,
                    y: 15,
                    width: 30,
                    height: 12,
                  },
                ],
              };
            }
          }
          return panel;
        }),
      }));

      setPages(healedPages);
      setActivePageId(persistedSnapshot.activePageId);
      setStoryTitle(persistedSnapshot.storyTitle);
      setStoryText(persistedSnapshot.storyText);
      setSelectedPanelId(persistedSnapshot.selectedPanelId);
      setSelectedBubbleId(persistedSnapshot.selectedBubbleId);
    },
    [
      setActiveProjectId,
      setCharacters,
      setPages,
      setActivePageId,
      setProjects,
      setSelectedBubbleId,
      setSelectedPanelId,
      setStoryText,
      setStoryTitle,
    ],
  );

  useStudioPersistence({ snapshot, onSnapshotLoaded: hydrateFromSnapshot });
}
