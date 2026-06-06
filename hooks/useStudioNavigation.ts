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
  const [view, setView] = useState<View>("storyboard");
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
  const [activePageId, setActivePageId] = useState(initialPageId);
  const [selectedPanelId, setSelectedPanelId] = useState("");
  const [selectedBubbleId, setSelectedBubbleId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  return {
    view,
    setView,
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
  };
}
