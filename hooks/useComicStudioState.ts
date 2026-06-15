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

const INITIAL_PROJECT_ID = "workspace-project";
const INITIAL_PAGE_ID = "workspace-page";

const INITIAL_PROJECT: Project = {
  id: INITIAL_PROJECT_ID,
  title: "Truyện mới",
  status: "draft",
  updatedAt: "Chưa tạo storyboard",
  panelCount: 0,
  style: "webtoon",
};

const INITIAL_PAGE: Page = {
  id: INITIAL_PAGE_ID,
  projectId: INITIAL_PROJECT_ID,
  orderIndex: 1,
  title: "Page 1",
  panels: [],
};

export function useComicStudioState() {
  const [projects, setProjects] = useState<Project[]>([INITIAL_PROJECT]);
  const [pages, setPages] = useState<Page[]>([INITIAL_PAGE]);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [importError, setImportError] = useState("");
  const [isAnalyzingStory, setIsAnalyzingStory] = useState(false);

  // 1. Phân rã Trạng thái Điều hướng & Lựa chọn
  const nav = useStudioNavigation(INITIAL_PROJECT_ID, INITIAL_PAGE_ID);

  // 2. Phân rã Trạng thái Nhân vật & Casting
  const casting = useCastingState([]);

  const activeCharacters = useMemo(() => {
    return casting.characters.filter((c) => {
      const pId = c.projectId || INITIAL_PROJECT_ID;
      return pId === nav.activeProjectId;
    });
  }, [casting.characters, nav.activeProjectId]);

  const activeProject =
    projects.find((project) => project.id === nav.activeProjectId) ??
    projects[0];

  const activeProjectPages = useMemo(() => {
    return pages.filter((page) => {
      const pId = page.projectId || INITIAL_PROJECT_ID;
      return pId === nav.activeProjectId;
    });
  }, [pages, nav.activeProjectId]);

  const activeProjectPagesWithGlobalIndices = useMemo(() => {
    let globalIndex = 0;
    const sortedPages = [...activeProjectPages].sort((a, b) => a.orderIndex - b.orderIndex);
    return sortedPages.map((page) => ({
      ...page,
      panels: page.panels.map((panel) => {
        globalIndex++;
        return {
          ...panel,
          orderIndex: globalIndex,
        };
      }),
    }));
  }, [activeProjectPages]);

  const activePage =
    activeProjectPagesWithGlobalIndices.find((page) => page.id === nav.activePageId) ??
    activeProjectPagesWithGlobalIndices[0] ??
    pages[0];

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
    pages: activeProjectPages,
    characters: activeCharacters,
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

      setProjects((current) => {
        const next = [
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
        ];
        return current.length === 1 && current[0].id === INITIAL_PROJECT_ID && current[0].panelCount === 0
          ? next.filter((p) => p.id !== INITIAL_PROJECT_ID)
          : next;
      });
      nav.setActiveProjectId(projectId);

      setPages((current) => {
        const isInitialEmpty =
          current.length === 1 &&
          current[0].id === INITIAL_PAGE_ID &&
          (current[0].panels.length === 0 ||
            (current[0].panels.length === 1 &&
              current[0].panels[0].scenePrompt.startsWith("Blank panel")));
        
        if (isInitialEmpty) {
          return pagesWithCorrectProjectId;
        }
        return [...pagesWithCorrectProjectId, ...current];
      });

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

      const occurrences: Record<string, number> = {};
      pagesWithCorrectProjectId.forEach((page) => {
        page.panels.forEach((panel) => {
          panel.characterIds.forEach((id) => {
            if (id && id !== "unknown-character") {
              occurrences[id] = (occurrences[id] || 0) + 1;
            }
          });
        });
      });

      const sortedIds = Array.from(detectedIds).sort(
        (a, b) => (occurrences[b] || 0) - (occurrences[a] || 0)
      );

      const colors = [
        "#8b5cf6",
        "#ef4444",
        "#10b981",
        "#f59e0b",
        "#3b82f6",
        "#ec4899",
      ];
      const newCharactersList = sortedIds.map((id, idx) => {
        const name = prettifyCharacterId(id) || `Nhân vật ${idx + 1}`;
        const count = occurrences[id] || 0;
        const priority = idx + 1;
        
        let role = "Vai phụ";
        if (idx === 0) {
          role = "Vai chính";
        } else if (count === 1) {
          role = "Quần chúng";
        }

        const gender = detectGender(id, name, finalText);

        return {
          id,
          projectId,
          name,
          role,
          gender,
          priority,
          description: `Nhân vật ${name}. Xuất hiện trong ${count} khung hình.`,
          color: colors[idx % colors.length],
        };
      });

      if (newCharactersList.length > 0) {
        casting.setCharacters((current) => [
          ...newCharactersList,
          ...current.filter((c) => c.projectId !== projectId),
        ]);
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
    const newPageIndex = activeProjectPages.length + 1;
    const newPage = {
      id: newPageId,
      projectId: nav.activeProjectId,
      orderIndex: newPageIndex,
      title: `Page ${newPageIndex}`,
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
    const pageToDelete = pages.find((p) => p.id === pageId);
    if (!pageToDelete) return;
    const projectId = pageToDelete.projectId || INITIAL_PROJECT_ID;

    const remainingPages = pages.filter((page) => page.id !== pageId);
    const remainingProjectPages = remainingPages.filter((page) => {
      const pId = page.projectId || INITIAL_PROJECT_ID;
      return pId === projectId;
    });

    if (remainingProjectPages.length === 0) {
      return;
    }

    let projectIndex = 0;
    const reorderedPages = remainingPages.map((page) => {
      const pId = page.projectId || INITIAL_PROJECT_ID;
      if (pId === projectId) {
        projectIndex++;
        return {
          ...page,
          orderIndex: projectIndex,
          title: `Page ${projectIndex}`,
        };
      }
      return page;
    });

    setPages(reorderedPages);
    setProjects((currentProjects) =>
      syncProjectPanelCounts(currentProjects, reorderedPages),
    );

    if (nav.activePageId === pageId) {
      const fallbackPage = reorderedPages.find((page) => {
        const pId = page.projectId || INITIAL_PROJECT_ID;
        return pId === projectId;
      }) || reorderedPages[0];

      nav.setActivePageId(fallbackPage.id);
      nav.setSelectedPanelId(fallbackPage.panels[0]?.id ?? "");
      nav.setSelectedBubbleId(fallbackPage.panels[0]?.bubbles[0]?.id ?? "");
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

  function deleteProject(projectId: string) {
    const remainingProjects = projects.filter((p) => p.id !== projectId);
    const nextProject = remainingProjects[0] || INITIAL_PROJECT;

    let newActivePageId = "";
    let newActivePanelId = "";

    if (nav.activeProjectId === projectId) {
      const nextProjectPages = pages.filter((page) => page.projectId === nextProject.id);
      if (nextProjectPages.length > 0) {
        newActivePageId = nextProjectPages[0].id;
        newActivePanelId = nextProjectPages[0].panels[0]?.id ?? "";
      } else if (nextProject.id === INITIAL_PROJECT_ID) {
        newActivePageId = crypto.randomUUID();
      }
    }

    casting.setCharacters((current) => current.filter((c) => c.projectId !== projectId));

    setProjects((current) => {
      const updated = current.filter((p) => p.id !== projectId);
      return updated.length > 0 ? updated : [INITIAL_PROJECT];
    });

    setPages((currentPages) => {
      const updated = currentPages.filter((page) => page.projectId !== projectId);
      if (nav.activeProjectId === projectId && nextProject.id === INITIAL_PROJECT_ID) {
        const nextProjectPages = updated.filter((page) => page.projectId === INITIAL_PROJECT_ID);
        if (nextProjectPages.length === 0) {
          const defaultPage = {
            ...INITIAL_PAGE,
            id: newActivePageId || crypto.randomUUID(),
          };
          return [defaultPage, ...updated];
        }
      }
      return updated;
    });

    if (nav.activeProjectId === projectId) {
      nav.setActiveProjectId(nextProject.id);
      if (newActivePageId) {
        nav.setActivePageId(newActivePageId);
        nav.setSelectedPanelId(newActivePanelId);
        nav.setSelectedBubbleId("");
      } else {
        nav.setActivePageId("");
        nav.setSelectedPanelId("");
        nav.setSelectedBubbleId("");
      }
    }
  }

  // 5. Phân rã Trạng thái Kéo thả Bong bóng thoại
  const drag = useBubbleDragState(updateBubble);

  const allPanels = useMemo(
    () => activeProjectPagesWithGlobalIndices.flatMap((page) => page.panels),
    [activeProjectPagesWithGlobalIndices],
  );

  return {
    state: {
      view: nav.view,
      projects,
      activeProjectId: nav.activeProjectId,
      activeProject,
      characters: activeCharacters,
      pages: activeProjectPagesWithGlobalIndices,
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
      addCharacter: () => casting.addCharacter(nav.activeProjectId),
      deleteCharacter: casting.deleteCharacter,
      updateCharacter: casting.updateCharacter,
      addPage,
      deletePage,
      deleteProject,
      setActivePageId: nav.setActivePageId,
      addBubble,
      updateBubble,
      deleteBubble,
      handleBubbleMove: drag.handleBubbleMove,
    },
  };
}

function prettifyCharacterId(characterId: string) {
  return characterId
    .split("-")
    .filter((word) => word.length > 1)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function detectGender(id: string, name: string, storyText: string): "Nam" | "Nữ" | "Khác" {
  const lowerText = storyText.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerId = id.toLowerCase();
  
  if (/\b(cô|nàng|nữ|chị|bà|mẹ|vợ|am|hoa)\b/i.test(lowerName)) {
    return "Nữ";
  }
  if (/\b(anh|chàng|cậu|nam|ông|bố|chồng|lão|tể|phu)\b/i.test(lowerName)) {
    return "Nam";
  }
  
  const sentences = lowerText.split(/[.!?\n]+/);
  let femaleScore = 0;
  let maleScore = 0;
  
  for (const sentence of sentences) {
    if (sentence.includes(lowerName) || sentence.includes(lowerId)) {
      if (/\b(cô ấy|nàng|chị ấy|thiếu nữ|nữ tử|nữ nhân|bà ấy|mẹ|vợ|cô|chị|em gái)\b/.test(sentence)) {
        femaleScore++;
      }
      if (/\b(anh ấy|chàng|cậu ấy|nam nhân|ông ấy|bố|chồng|anh|cậu|em trai|gã|hắn)\b/.test(sentence)) {
        maleScore++;
      }
    }
  }
  
  if (femaleScore > maleScore) {
    return "Nữ";
  }
  if (maleScore > femaleScore) {
    return "Nam";
  }
  
  // Endings check for common Vietnamese names
  if (/\b(hùng|cường|minh|tuấn|kiên|hoàng|dũng|sơn|hải|phong|vũ|thành|đạt|nam|trung|khánh|lâm|thịnh|tèo|tí)\b/.test(lowerName)) {
    return "Nam";
  }
  if (/\b(hoa|lan|mai|cúc|vy|trang|hương|nhung|phương|thảo|linh|hà|chi|diệp|anh|tuyết|ngọc|nhi|quỳnh|thư)\b/.test(lowerName)) {
    return "Nữ";
  }
  
  return "Khác";
}
