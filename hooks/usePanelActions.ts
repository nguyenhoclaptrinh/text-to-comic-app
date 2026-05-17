/**
 * @file usePanelActions.ts
 * @description Panel mutation and generation actions for the comic studio.
 */

import { useState } from "react";

import {
  generatePanelImage,
  getStudioAiErrorMessage,
} from "@/lib/studio/ai-services";
import type { Panel, Project } from "@/lib/studio/types";

export function usePanelActions({
  panels,
  activeProjectId,
  selectedPanelId,
  setProjects,
  setPanels,
  setSelectedPanelId,
  setSelectedBubbleId,
}: {
  panels: Panel[];
  activeProjectId: string;
  selectedPanelId: string;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setPanels: React.Dispatch<React.SetStateAction<Panel[]>>;
  setSelectedPanelId: (panelId: string) => void;
  setSelectedBubbleId: (bubbleId: string) => void;
}) {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  function updatePanel(panelId: string, patch: Partial<Panel>) {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId ? { ...panel, ...patch } : panel,
      ),
    );
  }

  function deletePanel(panelId: string) {
    const nextPanels = panels.filter((panel) => panel.id !== panelId);
    if (nextPanels.length === 0) {
      return;
    }

    setPanels(nextPanels);
    setProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? { ...project, panelCount: nextPanels.length }
          : project,
      ),
    );

    if (selectedPanelId === panelId) {
      const nextSelectedPanel = nextPanels[0];
      setSelectedPanelId(nextSelectedPanel.id);
      setSelectedBubbleId(nextSelectedPanel.bubbles[0]?.id ?? "");
    }
  }

  async function generatePanel(panelId: string) {
    const target = panels.find((panel) => panel.id === panelId);
    if (!target || target.status === "generating") {
      return;
    }

    updatePanel(panelId, { status: "generating", errorMessage: undefined });

    try {
      updatePanel(panelId, await generatePanelImage(target));
    } catch (error) {
      updatePanel(panelId, {
        status: "error",
        errorMessage: getStudioAiErrorMessage(error),
      });
    }
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

  return {
    isGeneratingAll,
    updatePanel,
    deletePanel,
    generatePanel,
    generateAll,
  };
}
