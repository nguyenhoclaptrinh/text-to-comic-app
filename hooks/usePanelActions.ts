/**
 * @file usePanelActions.ts
 * @description Panel mutation and generation actions for the multi-page comic studio.
 */

import { useState } from "react";

import {
  generatePanelImage,
  getStudioAiErrorMessage,
} from "@/lib/studio/ai-services";
import { dialogueToBubble } from "@/lib/studio/utils";
import type { Character, Page, Panel, Project } from "@/lib/studio/types";

export function usePanelActions({
  pages,
  characters,
  activeProjectId,
  selectedPanelId,
  setProjects,
  setPages,
  setSelectedPanelId,
  setSelectedBubbleId,
  projectStyle,
}: {
  pages: Page[];
  characters: Character[];
  activeProjectId: string;
  selectedPanelId: string;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setSelectedPanelId: (panelId: string) => void;
  setSelectedBubbleId: (bubbleId: string) => void;
  projectStyle: string;
}) {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  function updatePanel(panelId: string, patch: Partial<Panel>) {
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        panels: page.panels.map((panel) => {
          if (panel.id !== panelId) {
            return panel;
          }

          const updatedPanel = { ...panel, ...patch };

          if (
            patch.dialogue !== undefined &&
            patch.dialogue !== panel.dialogue
          ) {
            const cleanText = dialogueToBubble(patch.dialogue);
            if (panel.bubbles.length > 0) {
              updatedPanel.bubbles = panel.bubbles.map((bubble, idx) =>
                idx === 0 ? { ...bubble, text: cleanText } : bubble,
              );
            }
          }

          return updatedPanel;
        }),
      })),
    );
  }

  function deletePanel(panelId: string) {
    let nextSelectedPanel: Panel | undefined;

    setPages((currentPages) => {
      const updatedPages = currentPages.map((page) => {
        const nextPanels = page.panels.filter((panel) => panel.id !== panelId);
        if (nextPanels.length === 0) {
          return page; // Tránh làm rỗng trang hoàn toàn
        }

        const reorderedPanels = nextPanels.map((panel, index) => ({
          ...panel,
          orderIndex: index + 1,
        }));

        if (page.panels.some((p) => p.id === panelId)) {
          nextSelectedPanel = reorderedPanels[0];
        }

        return {
          ...page,
          panels: reorderedPanels,
        };
      });

      return updatedPages;
    });

    // Cập nhật tổng số panel của project
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== activeProjectId) return project;

        // Tính toán lại tổng panel trên tất cả các trang
        let totalCount = 0;
        pages.forEach((p) => {
          totalCount += p.panels.filter((pan) => pan.id !== panelId).length;
        });
        return { ...project, panelCount: totalCount };
      }),
    );

    if (selectedPanelId === panelId && nextSelectedPanel) {
      setSelectedPanelId(nextSelectedPanel.id);
      setSelectedBubbleId(nextSelectedPanel.bubbles[0]?.id ?? "");
    }
  }

  async function generatePanel(panelId: string) {
    let target: Panel | undefined;
    for (const page of pages) {
      target = page.panels.find((p) => p.id === panelId);
      if (target) break;
    }

    if (!target || target.status === "generating") {
      return;
    }

    updatePanel(panelId, { status: "generating", errorMessage: undefined });

    try {
      const resolvedStyle = (target.style && target.style !== "inherit" ? target.style : (projectStyle || "webtoon")) as
        | "manga"
        | "webtoon"
        | "western";
      const panelWithResolvedStyle = { ...target, style: resolvedStyle };
      updatePanel(
        panelId,
        await generatePanelImage(panelWithResolvedStyle, characters),
      );
    } catch (error) {
      updatePanel(panelId, {
        status: "error",
        errorMessage: getStudioAiErrorMessage(error),
      });
    }
  }

  async function generateAll() {
    setIsGeneratingAll(true);
    const panelsToGenerate: string[] = [];
    pages.forEach((page) => {
      page.panels.forEach((panel) => {
        if (panel.status !== "success") {
          panelsToGenerate.push(panel.id);
        }
      });
    });

    for (const panelId of panelsToGenerate) {
      await generatePanel(panelId);
    }
    setIsGeneratingAll(false);
  }

  function movePanel(panelId: string, direction: "up" | "down") {
    setPages((currentPages) =>
      currentPages.map((page) => {
        const panelIdx = page.panels.findIndex((p) => p.id === panelId);
        if (panelIdx === -1) {
          return page;
        }

        const targetIdx = direction === "up" ? panelIdx - 1 : panelIdx + 1;
        if (targetIdx < 0 || targetIdx >= page.panels.length) {
          return page;
        }

        const newPanels = [...page.panels];
        const temp = newPanels[panelIdx];
        newPanels[panelIdx] = newPanels[targetIdx];
        newPanels[targetIdx] = temp;

        const reorderedPanels = newPanels.map((panel, idx) => ({
          ...panel,
          orderIndex: idx + 1,
        }));

        return {
          ...page,
          panels: reorderedPanels,
        };
      }),
    );
  }

  return {
    isGeneratingAll,
    updatePanel,
    deletePanel,
    generatePanel,
    generateAll,
    movePanel,
  };
}
