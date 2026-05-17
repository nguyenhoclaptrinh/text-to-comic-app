/**
 * @file useComicStudioState.ts
 * @description State and actions for the frontend-only comic studio prototype.
 */

import { useMemo, useState } from "react";

import {
  BUBBLE_BOUNDARY_PADDING,
  DEFAULT_BUBBLE_HEIGHT,
  DEFAULT_BUBBLE_WIDTH,
  GENERATION_DELAY_MS,
} from "@/lib/studio/constants";
import {
  createCharacter,
  createDefaultBubble,
  createGeneratedBubble,
  createProject,
} from "@/lib/studio/factories";
import {
  CHARACTERS_SEED,
  PANELS_SEED,
  PROJECTS_SEED,
  SAMPLE_STORY,
} from "@/lib/studio/mock-data";
import { clamp, createMockPanels, sleep } from "@/lib/studio/utils";
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
  const [selectedPanelId, setSelectedPanelId] = useState(PANELS_SEED[0].id);
  const [selectedBubbleId, setSelectedBubbleId] = useState(
    PANELS_SEED[0].bubbles[0]?.id ?? "",
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

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

  function selectProject(projectId: string) {
    setActiveProjectId(projectId);
    setView("storyboard");
  }

  function analyzeStory() {
    if (!storyTitle.trim() || !storyText.trim()) {
      setImportError("Title and story text are required.");
      return;
    }

    const projectId = `project-${Date.now()}`;
    const generatedPanels = createMockPanels(storyText);
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
  }

  function updatePanel(panelId: string, patch: Partial<Panel>) {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId ? { ...panel, ...patch } : panel,
      ),
    );
  }

  async function generatePanel(panelId: string) {
    const target = panels.find((panel) => panel.id === panelId);
    if (!target || target.status === "generating") {
      return;
    }

    updatePanel(panelId, { status: "generating", errorMessage: undefined });
    await sleep(GENERATION_DELAY_MS);
    updatePanel(panelId, {
      status: "success",
      bubbles:
        target.bubbles.length > 0
          ? target.bubbles
          : [createGeneratedBubble(target)],
    });
  }

  async function generateAll() {
    setIsGeneratingAll(true);
    for (const panelId of panels
      .filter((panel) => panel.status !== "success")
      .map((panel) => panel.id)) {
      await generatePanel(panelId);
    }
    setIsGeneratingAll(false);
  }

  function addCharacter() {
    setCharacters((current) => [
      ...current,
      createCharacter(current.length + 1),
    ]);
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
      selectedPanelId,
      selectedBubbleId,
      selectedBubble,
      dragging,
      exportOpen,
      isGeneratingAll,
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
      updatePanel,
      generatePanel,
      generateAll,
      addCharacter,
      addBubble,
      updateBubble,
      deleteBubble,
      handleBubbleMove,
    },
  };
}

function updatePanelBubble(
  panel: Panel,
  panelId: string,
  bubbleId: string,
  patch: Partial<Bubble>,
) {
  if (panel.id !== panelId) {
    return panel;
  }

  return {
    ...panel,
    bubbles: panel.bubbles.map((bubble) =>
      bubble.id === bubbleId ? { ...bubble, ...patch } : bubble,
    ),
  };
}

function nextBubbleCoordinate(
  pointer: number,
  stageStart: number,
  offset: number,
  stageSize: number,
  itemSize: number,
) {
  const max = Math.max(
    stageSize - itemSize - BUBBLE_BOUNDARY_PADDING,
    BUBBLE_BOUNDARY_PADDING,
  );
  return Math.round(
    clamp(pointer - stageStart - offset, BUBBLE_BOUNDARY_PADDING, max),
  );
}
