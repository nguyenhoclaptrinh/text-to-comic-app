/**
 * @file useComicStudioState.ts
 * @description Refactored high-level Orchestrator hook managing multi-page studio states.
 */

import { useMemo, useState } from "react";

import { useComicStudioPersistence } from "@/hooks/useComicStudioPersistence";
import { usePanelActions } from "@/hooks/usePanelActions";
import { useStudioNavigation } from "@/hooks/useStudioNavigation";
import { useCastingState } from "@/hooks/useCastingState";
import { useBubbleDragState } from "@/hooks/useBubbleDragState";
import { createDefaultBubble, createProject } from "@/lib/studio/factories";
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
  countMissingImages,
  countPanelsForProject,
  getPanelsForProject,
  summarizeGeneration,
  syncProjectPanelCounts,
} from "@/lib/studio/selectors";
import { updatePanelBubble } from "@/lib/studio/utils";
import type { Bubble, Page, Project } from "@/lib/studio/types";

export function useComicStudioState() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS_SEED);
  const [pages, setPages] = useState<Page[]>(PAGES_SEED);
  const [storyTitle, setStoryTitle] = useState("Snow Road Inn");
  const [storyText, setStoryText] = useState(SAMPLE_STORY);
  const [importError, setImportError] = useState("");
  const [isAnalyzingStory, setIsAnalyzingStory] = useState(false);

  // 1. Phân rã Trạng thái Điều hướng & Lựa chọn
  const nav = useStudioNavigation(PROJECTS_SEED[0].id, PAGES_SEED[0].id);

  // 2. Phân rã Trạng thái Nhân vật & Casting
  const casting = useCastingState(CHARACTERS_SEED);

  const activeProject =
    projects.find((project) => project.id === nav.activeProjectId) ??
    projects[0];

  const activePage =
    pages.find((page) => page.id === nav.activePageId) ?? pages[0];

  const panels = activePage?.panels ?? [];

  // Tương thích ngược/Duy trì các trạng thái mặc định
  const selectedPanelId = nav.selectedPanelId || (panels[0]?.id ?? "");
  const selectedBubbleId =
    nav.selectedBubbleId || (panels[0]?.bubbles[0]?.id ?? "");

  const selectedPanel =
    panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];

  const selectedBubble = selectedPanel?.bubbles.find(
    (bubble) => bubble.id === selectedBubbleId,
  );

  const missingImages = useMemo(
    () => countMissingImages(pages, nav.activeProjectId),
    [pages, nav.activeProjectId],
  );

  const generationSummary = useMemo(
    () => summarizeGeneration(pages, nav.activeProjectId),
    [pages, nav.activeProjectId],
  );

  // 3. Đồng bộ hóa Local & Cloud Persistence
  useComicStudioPersistence(
    {
      projects,
      activeProjectId: nav.activeProjectId,
      characters: casting.characters,
      pages,
      activePageId: nav.activePageId,
      storyTitle,
      storyText,
      selectedPanelId,
      selectedBubbleId,
    },
    {
      setProjects,
      setActiveProjectId: nav.setActiveProjectId,
      setCharacters: casting.setCharacters,
      setPages,
      setActivePageId: nav.setActivePageId,
      setStoryTitle,
      setStoryText,
      setSelectedPanelId: nav.setSelectedPanelId,
      setSelectedBubbleId: nav.setSelectedBubbleId,
    },
  );

  // 4. Lớp Actions điều hành Panel
  const panelActions = usePanelActions({
    pages,
    characters: casting.characters,
    selectedPanelId,
    setProjects,
    setPages,
    setSelectedPanelId: nav.setSelectedPanelId,
    setSelectedBubbleId: nav.setSelectedBubbleId,
    projectStyle: activeProject?.style || "webtoon",
  });

  function selectProject(projectId: string) {
    nav.setActiveProjectId(projectId);

    const projectPages = pages.filter((page) => page.projectId === projectId);
    if (projectPages.length > 0) {
      nav.setActivePageId(projectPages[0].id);
      nav.setSelectedPanelId(projectPages[0].panels[0]?.id ?? "");
      nav.setSelectedBubbleId(projectPages[0].panels[0]?.bubbles[0]?.id ?? "");
    }

    nav.setView("storyboard");
  }

  function updateProjectStyle(projectId: string, style: string) {
    setProjects((current) =>
      current.map((p) => (p.id === projectId ? { ...p, style } : p)),
    );
  }

  async function analyzeStory(
    style: string = "webtoon",
    overrideTitle?: string,
    overrideText?: string,
    genre?: string,
    aspectRatio?: string,
  ) {
    setIsAnalyzingStory(true);

    const finalTitle = overrideTitle !== undefined ? overrideTitle : storyTitle;
    const finalText = overrideText !== undefined ? overrideText : storyText;

    if (overrideTitle !== undefined) setStoryTitle(overrideTitle);
    if (overrideText !== undefined) setStoryText(overrideText);

    try {
      const projectId = crypto.randomUUID();
      const generatedPages = await analyzeStoryToPages({
        storyTitle: finalTitle,
        storyText: finalText,
      });

      setImportError("");
      const pagesWithCorrectProjectId = generatedPages.map((page) => ({
        ...page,
        projectId,
        panels: page.panels.map((p) => ({ ...p, style: "inherit" as const })),
      }));

      setProjects((current) => [
        {
          ...createProject(
            projectId,
            finalTitle,
            countPanelsForProject(pagesWithCorrectProjectId, projectId),
            genre,
            aspectRatio,
          ),
          style,
        },
        ...current,
      ]);
      nav.setActiveProjectId(projectId);

      setPages(pagesWithCorrectProjectId);

      // Trích xuất nhân vật tự động từ các panels
      const detectedIds = new Set<string>();
      pagesWithCorrectProjectId.forEach((page) => {
        page.panels.forEach((panel) => {
          panel.characterIds.forEach((id) => {
            if (id && id !== "unknown-character") {
              detectedIds.add(id);
            }
          });
        });
      });

      const colors = [
        "#8b5cf6",
        "#ef4444",
        "#10b981",
        "#f59e0b",
        "#3b82f6",
        "#ec4899",
      ];
      const newCharactersList = Array.from(detectedIds).map((id, idx) => {
        const name = id
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        return {
          id,
          name,
          role: idx === 0 ? "Main protagonist" : "Supporting role",
          description: `Nhân vật trong truyện: ${name}.`,
          color: colors[idx % colors.length],
        };
      });

      if (newCharactersList.length > 0) {
        casting.setCharacters(newCharactersList);
      }

      const firstPage = pagesWithCorrectProjectId[0] || generatedPages[0];
      nav.setActivePageId(firstPage.id);
      nav.setSelectedPanelId(firstPage.panels[0].id);
      nav.setSelectedBubbleId(firstPage.panels[0].bubbles[0]?.id ?? "");
      nav.setView("storyboard");
    } catch (error) {
      setImportError(getStudioAiErrorMessage(error));
    } finally {
      setIsAnalyzingStory(false);
    }
  }

  function addPage() {
    const newPageId = crypto.randomUUID();
    const newPage = {
      id: newPageId,
      projectId: nav.activeProjectId,
      orderIndex: pages.length + 1,
      title: `Page ${pages.length + 1}`,
      panels: [
        {
          id: crypto.randomUUID(),
          orderIndex: 1,
          scenePrompt: "Blank panel. Double click to edit scene description...",
          dialogue: "Character: Dialogue...",
          characterIds: [],
          status: "draft" as const,
          imageTone: "from-zinc-900 via-stone-800 to-slate-900",
          bubbles: [],
          seed: Math.floor(Math.random() * 1000000),
          style: "inherit" as const,
        },
      ],
    };

    setPages((current) => {
      const nextPages = [...current, newPage];
      setProjects((currentProjects) =>
        syncProjectPanelCounts(currentProjects, nextPages),
      );
      return nextPages;
    });
    nav.setActivePageId(newPageId);
    nav.setSelectedPanelId(newPage.panels[0].id);
    nav.setSelectedBubbleId("");
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
    setProjects((currentProjects) =>
      syncProjectPanelCounts(currentProjects, reorderedPages),
    );

    if (nav.activePageId === pageId) {
      const fallbackPage = reorderedPages[0];
      nav.setActivePageId(fallbackPage.id);
      nav.setSelectedPanelId(fallbackPage.panels[0].id);
      nav.setSelectedBubbleId(fallbackPage.panels[0].bubbles[0]?.id ?? "");
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
    nav.setSelectedPanelId(panelId);
    nav.setSelectedBubbleId(bubble.id);
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
                bubbles: panel.bubbles.filter(
                  (bubble) => bubble.id !== bubbleId,
                ),
              }
            : panel,
        ),
      })),
    );
    nav.setSelectedBubbleId("");
  }

  // 5. Phân rã Trạng thái Kéo thả Bong bóng thoại
  const drag = useBubbleDragState(updateBubble);

  const allPanels = useMemo(
    () => getPanelsForProject(pages, nav.activeProjectId),
    [pages, nav.activeProjectId],
  );

  return {
    state: {
      view: nav.view,
      projects,
      activeProjectId: nav.activeProjectId,
      activeProject,
      characters: casting.characters,
      pages,
      activePageId: nav.activePageId,
      panels,
      allPanels,
      storyTitle,
      storyText,
      importError,
      isAnalyzingStory,
      selectedPanelId,
      selectedBubbleId,
      selectedBubble,
      dragging: drag.dragging,
      exportOpen: nav.exportOpen,
      isGeneratingAll: panelActions.isGeneratingAll,
      missingImages,
      generationSummary,
    },
    actions: {
      setView: nav.setView,
      setStoryTitle,
      setStoryText,
      setSelectedPanelId: nav.setSelectedPanelId,
      setSelectedBubbleId: nav.setSelectedBubbleId,
      setDragging: drag.setDragging,
      setExportOpen: nav.setExportOpen,
      selectProject,
      analyzeStory,
      updateProjectStyle,
      updatePanel: panelActions.updatePanel,
      deletePanel: panelActions.deletePanel,
      generatePanel: panelActions.generatePanel,
      generateAll: panelActions.generateAll,
      movePanel: panelActions.movePanel,
      addCharacter: casting.addCharacter,
        deleteCharacter: casting.deleteCharacter,
      updateCharacter: casting.updateCharacter,
      addPage,
      deletePage,
      setActivePageId: nav.setActivePageId,
      addBubble,
      updateBubble,
      deleteBubble,
      handleBubbleMove: drag.handleBubbleMove,
    },
  };
}
