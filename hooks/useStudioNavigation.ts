/**
 * @file useStudioNavigation.ts
 * @description Hook managing navigation, active projects, pages, selections, and modals.
 */

import { useState } from "react";
import type { View } from "@/lib/studio/types";

export function useStudioNavigation(
  initialProjectId: string,
  initialPageId: string,
) {
  const [view, setView] = useState<View>("projects");
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
  const [activePageId, setActivePageId] = useState(initialPageId);
  const [selectedPanelId, setSelectedPanelId] = useState("");
  const [selectedBubbleId, setSelectedBubbleId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  const handleSetView = (newView: View | ((prev: View) => View)) => {
    if (typeof newView === "function") {
      setView((prev) => {
        const next = newView(prev);
        if (next === "projects") {
          setIsProjectOpen(false);
        }
        return next;
      });
    } else {
      setView(newView);
      if (newView === "projects") {
        setIsProjectOpen(false);
      }
    }
  };

  return {
    view,
    setView: handleSetView,
    activeProjectId,
    setActiveProjectId,
    activePageId,
    setActivePageId,
    selectedPanelId,
    setSelectedPanelId,
    selectedBubbleId,
    setSelectedBubbleId,
    exportOpen,
    setExportOpen,
    isProjectOpen,
    setIsProjectOpen,
  };
}
