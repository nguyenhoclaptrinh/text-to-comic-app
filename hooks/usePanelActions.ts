/**
 * @file usePanelActions.ts
 * @description Panel mutation and generation actions for the multi-page comic studio.
 */

import { useState } from "react";

import {
  generatePanelImage,
  generatePanelImageWithKaggleFallback,
  getStudioAiErrorMessage,
} from "@/lib/studio/ai-services";
import {
  markPanelGenerationFailed,
  markPanelGenerating,
  markPanelQueued,
} from "@/lib/studio/domain";
import { getPublicKaggleEnabled } from "@/lib/studio/production-config";
import { syncProjectPanelCounts } from "@/lib/studio/selectors";
import { getPanelBubbleSeed, isSeedBubbleText } from "@/lib/studio/display";
import type { Character, Page, Panel, Project } from "@/lib/studio/types";

export function usePanelActions({
  pages,
  characters,
  selectedPanelId,
  setProjects,
  setPages,
  setSelectedPanelId,
  setSelectedBubbleId,
  projectStyle,
  displayLanguage,
}: {
  pages: Page[];
  characters: Character[];
  selectedPanelId: string;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setSelectedPanelId: (panelId: string) => void;
  setSelectedBubbleId: (bubbleId: string) => void;
  projectStyle: string;
  displayLanguage: "en" | "vi";
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

          const shouldReseedBubble =
            patch.dialogue !== undefined ||
            patch.dialogueDisplayEn !== undefined ||
            patch.dialogueDisplayVi !== undefined ||
            patch.dialogueDisplay !== undefined;

          if (shouldReseedBubble) {
            const previousSeedText = getPanelBubbleSeed(panel, displayLanguage);
            const nextSeedText = getPanelBubbleSeed(updatedPanel, displayLanguage);
            const canSyncSeedBubble =
              panel.bubbles.length === 1 &&
              isSeedBubbleText(panel, panel.bubbles[0]?.text || "");

            if (canSyncSeedBubble) {
              updatedPanel.bubbles = nextSeedText
                ? panel.bubbles.map((bubble, idx) =>
                    idx === 0 ? { ...bubble, text: nextSeedText } : bubble,
                  )
                : [];
            } else if (panel.bubbles.length === 0 && nextSeedText && previousSeedText !== nextSeedText) {
              updatedPanel.bubbles = [
                {
                  id: crypto.randomUUID(),
                  text: nextSeedText,
                  x: 35,
                  y: 15,
                  width: 30,
                  height: 12,
                },
              ];
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

      setProjects((current) => syncProjectPanelCounts(current, updatedPages));
      return updatedPages;
    });

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

    updatePanel(panelId, markPanelQueued(target));

    try {
      const resolvedStyle = (
        target.style && target.style !== "inherit"
          ? target.style
          : projectStyle || "webtoon"
      ) as "manga" | "webtoon" | "western";
      const panelWithResolvedStyle = { ...target, style: resolvedStyle };
      const kaggleEnabled = getPublicKaggleEnabled();
      updatePanel(panelId, markPanelGenerating(panelWithResolvedStyle));
      const generateImage = kaggleEnabled
        ? generatePanelImageWithKaggleFallback(
            panelWithResolvedStyle,
            characters,
            kaggleEnabled,
            (status, route) => {
              updatePanel(
                panelId,
                {
                  ...(status === "queued"
                    ? markPanelQueued(panelWithResolvedStyle)
                    : markPanelGenerating(panelWithResolvedStyle)),
                  ...route,
                },
              );
            },
          )
        : generatePanelImage(panelWithResolvedStyle, characters);
      updatePanel(panelId, await generateImage);
    } catch (error) {
      updatePanel(panelId, {
        ...markPanelGenerationFailed(target, getStudioAiErrorMessage(error)),
        imageUrl: target.imageUrl,
        bubbles: target.bubbles,
      });
    }
  }

  async function generateAll() {
    setIsGeneratingAll(true);
    const panelsToGenerate: string[] = [];
    pages.forEach((page) => {
      page.panels.forEach((panel) => {
        panelsToGenerate.push(panel.id);
      });
    });

    if (panelsToGenerate.length > 0) {
      setPages((currentPages) =>
        currentPages.map((page) => ({
          ...page,
          panels: page.panels.map((panel) =>
            panelsToGenerate.includes(panel.id)
              ? markPanelQueued(panel)
              : panel,
          ),
        })),
      );
    }

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
