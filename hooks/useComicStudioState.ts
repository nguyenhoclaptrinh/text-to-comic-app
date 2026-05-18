/**
 * @file useComicStudioState.ts
 * @description State and actions for the frontend-only comic studio prototype.
 */

import { useMemo, useState } from "react";

import { useComicStudioPersistence } from "@/hooks/useComicStudioPersistence";
import { usePanelActions } from "@/hooks/usePanelActions";
import {
  DEFAULT_BUBBLE_HEIGHT,
  DEFAULT_BUBBLE_WIDTH,
} from "@/lib/studio/constants";
import {
  createCharacter,
  createDefaultBubble,
  createProject,
} from "@/lib/studio/factories";
import {
  CHARACTERS_SEED,
  PANELS_SEED,
  PROJECTS_SEED,
  SAMPLE_STORY,
} from "@/lib/studio/mock-data";
import {
  analyzeStoryToPanels,
  getStudioAiErrorMessage,
} from "@/lib/studio/ai-services";
import {
  nextBubbleCoordinate,
  updateCharacterProfile,
  updatePanelBubble,
} from "@/lib/studio/utils";
import type {
  Bubble,
  Character,
  DragState,
  Panel,
  Project,
  View,
} from "@/lib/studio/types";

export function useComicStudioState() {
  const [view, setView] = useState<View>("storyboard");
  const [projects, setProjects] = useState<Project[]>(PROJECTS_SEED);
  const [activeProjectId, setActiveProjectId] = useState(PROJECTS_SEED[0].id);
  const [characters, setCharacters] = useState<Character[]>(CHARACTERS_SEED);
  const [panels, setPanels] = useState<Panel[]>(PANELS_SEED);
  const [storyTitle, setStoryTitle] = useState("Snow Road Inn");
  const [storyText, setStoryText] = useState(SAMPLE_STORY);
  const [importError, setImportError] = useState("");
  const [isAnalyzingStory, setIsAnalyzingStory] = useState(false);
  const [selectedPanelId, setSelectedPanelId] = useState(PANELS_SEED[0].id);
  const [selectedBubbleId, setSelectedBubbleId] = useState(
    PANELS_SEED[0].bubbles[0]?.id ?? "",
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const selectedPanel =
    panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];
  const selectedBubble = selectedPanel?.bubbles.find(
    (bubble) => bubble.id === selectedBubbleId,
  );
  const missingImages = panels.filter(
    (panel) => panel.status !== "success",
  ).length;

  const generationSummary = useMemo(() => {
    const done = panels.filter((panel) => panel.status === "success").length;
    const errors = panels.filter((panel) => panel.status === "error").length;
    return { done, errors, total: panels.length };
  }, [panels]);

  useComicStudioPersistence(
    {
      projects,
      activeProjectId,
      characters,
      panels,
      storyTitle,
      storyText,
      selectedPanelId,
      selectedBubbleId,
    },
    {
      setProjects,
      setActiveProjectId,
      setCharacters,
      setPanels,
      setStoryTitle,
      setStoryText,
      setSelectedPanelId,
      setSelectedBubbleId,
    },
  );

  const panelActions = usePanelActions({
    panels,
    characters,
    activeProjectId,
    selectedPanelId,
    setProjects,
    setPanels,
    setSelectedPanelId,
    setSelectedBubbleId,
  });

  function selectProject(projectId: string) {
    setActiveProjectId(projectId);
    setView("storyboard");
  }

  async function analyzeStory() {
    setIsAnalyzingStory(true);

    try {
      const projectId = `project-${Date.now()}`;
      const generatedPanels = await analyzeStoryToPanels({
        storyTitle,
        storyText,
      });

      setImportError("");
      setProjects((current) => [
        createProject(projectId, storyTitle),
        ...current,
      ]);
      setActiveProjectId(projectId);
      setPanels(generatedPanels);
      setSelectedPanelId(generatedPanels[0].id);
      setSelectedBubbleId(generatedPanels[0].bubbles[0]?.id ?? "");
      setView("storyboard");
    } catch (error) {
      setImportError(getStudioAiErrorMessage(error));
    } finally {
      setIsAnalyzingStory(false);
    }
  }

  function addCharacter() {
    setCharacters((current) => [
      ...current,
      createCharacter(current.length + 1),
    ]);
  }

  function updateCharacter(characterId: string, patch: Partial<Character>) {
    setCharacters((current) =>
      current.map((character) =>
        updateCharacterProfile(character, characterId, patch),
      ),
    );
  }

  function addBubble(panelId: string) {
    const bubble = createDefaultBubble();
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId
          ? { ...panel, bubbles: [...panel.bubbles, bubble] }
          : panel,
      ),
    );
    setSelectedPanelId(panelId);
    setSelectedBubbleId(bubble.id);
  }

  function updateBubble(
    panelId: string,
    bubbleId: string,
    patch: Partial<Bubble>,
  ) {
    setPanels((current) =>
      current.map((panel) =>
        updatePanelBubble(panel, panelId, bubbleId, patch),
      ),
    );
  }

  function deleteBubble(panelId: string, bubbleId: string) {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              bubbles: panel.bubbles.filter((bubble) => bubble.id !== bubbleId),
            }
          : panel,
      ),
    );
    setSelectedBubbleId("");
  }

  function handleBubbleMove(
    event: React.PointerEvent<HTMLDivElement>,
    panelId: string,
  ) {
    if (!dragging || dragging.panelId !== panelId) {
      return;
    }

    const stage = event.currentTarget.getBoundingClientRect();
    updateBubble(panelId, dragging.bubbleId, {
      x: nextBubbleCoordinate(
        event.clientX,
        stage.left,
        dragging.offsetX,
        stage.width,
        DEFAULT_BUBBLE_WIDTH,
      ),
      y: nextBubbleCoordinate(
        event.clientY,
        stage.top,
        dragging.offsetY,
        stage.height,
        DEFAULT_BUBBLE_HEIGHT,
      ),
    });
  }

  return {
    state: {
      view,
      projects,
      activeProjectId,
      activeProject,
      characters,
      panels,
      storyTitle,
      storyText,
      importError,
      isAnalyzingStory,
      selectedPanelId,
      selectedBubbleId,
      selectedBubble,
      dragging,
      exportOpen,
      isGeneratingAll: panelActions.isGeneratingAll,
      missingImages,
      generationSummary,
    },
    actions: {
      setView,
      setStoryTitle,
      setStoryText,
      setSelectedPanelId,
      setSelectedBubbleId,
      setDragging,
      setExportOpen,
      selectProject,
      analyzeStory,
      updatePanel: panelActions.updatePanel,
      deletePanel: panelActions.deletePanel,
      generatePanel: panelActions.generatePanel,
      generateAll: panelActions.generateAll,
      addCharacter,
      updateCharacter,
      addBubble,
      updateBubble,
      deleteBubble,
      handleBubbleMove,
    },
  };
}
