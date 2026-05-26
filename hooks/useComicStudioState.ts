/**
 * @file useComicStudioState.ts
 * @description State and actions for the multi-page comic studio.
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
  PAGES_SEED,
  PROJECTS_SEED,
  SAMPLE_STORY,
} from "@/lib/studio/mock-data";
import {
  analyzeStoryToPages,
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
  Page,
  Project,
  View,
} from "@/lib/studio/types";

export function useComicStudioState() {
  const [view, setView] = useState<View>("storyboard");
  const [projects, setProjects] = useState<Project[]>(PROJECTS_SEED);
  const [activeProjectId, setActiveProjectId] = useState(PROJECTS_SEED[0].id);
  const [characters, setCharacters] = useState<Character[]>(CHARACTERS_SEED);
  const [pages, setPages] = useState<Page[]>(PAGES_SEED);
  const [activePageId, setActivePageId] = useState(PAGES_SEED[0].id);
  const [storyTitle, setStoryTitle] = useState("Snow Road Inn");
  const [storyText, setStoryText] = useState(SAMPLE_STORY);
  const [importError, setImportError] = useState("");
  const [isAnalyzingStory, setIsAnalyzingStory] = useState(false);
  
  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0];

  const activePage =
    pages.find((page) => page.id === activePageId) ?? pages[0];

  const panels = activePage?.panels ?? [];

  const [selectedPanelId, setSelectedPanelId] = useState(panels[0]?.id ?? "");
  const [selectedBubbleId, setSelectedBubbleId] = useState(
    panels[0]?.bubbles[0]?.id ?? "",
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const selectedPanel =
    panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];
  
  const selectedBubble = selectedPanel?.bubbles.find(
    (bubble) => bubble.id === selectedBubbleId,
  );
  
  const missingImages = pages.reduce(
    (count, page) => count + page.panels.filter((panel) => panel.status !== "success").length,
    0,
  );

  const generationSummary = useMemo(() => {
    let done = 0;
    let errors = 0;
    let total = 0;
    pages.forEach((page) => {
      page.panels.forEach((panel) => {
        total++;
        if (panel.status === "success") {
          done++;
        } else if (panel.status === "error") {
          errors++;
        }
      });
    });
    return { done, errors, total };
  }, [pages]);

  useComicStudioPersistence(
    {
      projects,
      activeProjectId,
      characters,
      pages,
      activePageId,
      storyTitle,
      storyText,
      selectedPanelId,
      selectedBubbleId,
    },
    {
      setProjects,
      setActiveProjectId,
      setCharacters,
      setPages,
      setActivePageId,
      setStoryTitle,
      setStoryText,
      setSelectedPanelId,
      setSelectedBubbleId,
    },
  );

  const panelActions = usePanelActions({
    pages,
    characters,
    activeProjectId,
    selectedPanelId,
    setProjects,
    setPages,
    setSelectedPanelId,
    setSelectedBubbleId,
  });

  function selectProject(projectId: string) {
    setActiveProjectId(projectId);
    
    // Tải danh sách trang thuộc project này
    const projectPages = pages.filter((page) => page.projectId === projectId);
    if (projectPages.length > 0) {
      setActivePageId(projectPages[0].id);
      setSelectedPanelId(projectPages[0].panels[0]?.id ?? "");
      setSelectedBubbleId(projectPages[0].panels[0]?.bubbles[0]?.id ?? "");
    }
    
    setView("storyboard");
  }

  async function analyzeStory() {
    setIsAnalyzingStory(true);

    try {
      const projectId = `project-${Date.now()}`;
      const generatedPages = await analyzeStoryToPages({
        storyTitle,
        storyText,
      });

      setImportError("");
      setProjects((current) => [
        createProject(projectId, storyTitle),
        ...current,
      ]);
      setActiveProjectId(projectId);
      setPages(generatedPages);
      
      const firstPage = generatedPages[0];
      setActivePageId(firstPage.id);
      setSelectedPanelId(firstPage.panels[0].id);
      setSelectedBubbleId(firstPage.panels[0].bubbles[0]?.id ?? "");
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

  function addPage() {
    const newPageId = `page-${activeProjectId}-${Date.now()}`;
    const newPage = {
      id: newPageId,
      projectId: activeProjectId,
      orderIndex: pages.length + 1,
      title: `Page ${pages.length + 1}`,
      panels: [
        {
          id: `panel-${Date.now()}-1`,
          orderIndex: 1,
          scenePrompt: "Blank panel. Double click to edit scene description...",
          dialogue: "Character: Dialogue...",
          characterIds: [],
          status: "draft" as const,
          imageTone: "from-zinc-900 via-stone-800 to-slate-900",
          bubbles: [],
          seed: Math.floor(Math.random() * 1000000),
        },
      ],
    };

    setPages((current) => [...current, newPage]);
    setActivePageId(newPageId);
    setSelectedPanelId(newPage.panels[0].id);
    setSelectedBubbleId("");
  }

  function deletePage(pageId: string) {
    const nextPages = pages.filter((page) => page.id !== pageId);
    if (nextPages.length === 0) {
      return;
    }

    const reorderedPages = nextPages.map((page, idx) => ({
      ...page,
      orderIndex: idx + 1,
      title: `Page ${idx + 1}`,
    }));

    setPages(reorderedPages);

    if (activePageId === pageId) {
      const fallbackPage = reorderedPages[0];
      setActivePageId(fallbackPage.id);
      setSelectedPanelId(fallbackPage.panels[0].id);
      setSelectedBubbleId(fallbackPage.panels[0].bubbles[0]?.id ?? "");
    }
  }

  function addBubble(panelId: string) {
    const bubble = createDefaultBubble();
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        panels: page.panels.map((panel) =>
          panel.id === panelId
            ? { ...panel, bubbles: [...panel.bubbles, bubble] }
            : panel,
        ),
      })),
    );
    setSelectedPanelId(panelId);
    setSelectedBubbleId(bubble.id);
  }

  function updateBubble(
    panelId: string,
    bubbleId: string,
    patch: Partial<Bubble>,
  ) {
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        panels: page.panels.map((panel) =>
          updatePanelBubble(panel, panelId, bubbleId, patch),
        ),
      })),
    );
  }

  function deleteBubble(panelId: string, bubbleId: string) {
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        panels: page.panels.map((panel) =>
          panel.id === panelId
            ? {
                ...panel,
                bubbles: panel.bubbles.filter((bubble) => bubble.id !== bubbleId),
              }
            : panel,
        ),
      })),
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

  const allPanels = useMemo(() => {
    const projectPages = pages.filter((p) => p.projectId === activeProjectId);
    return projectPages.flatMap((page) => page.panels);
  }, [pages, activeProjectId]);

  return {
    state: {
      view,
      projects,
      activeProjectId,
      activeProject,
      characters,
      pages,
      activePageId,
      panels,
      allPanels,
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
      addPage,
      deletePage,
      setActivePageId,
      addBubble,
      updateBubble,
      deleteBubble,
      handleBubbleMove,
    },
  };
}
