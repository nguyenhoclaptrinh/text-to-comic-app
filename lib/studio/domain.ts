/**
 * @file domain.ts
 * @description Domain rules for studio entities that should not live in React components.
 */

import type { Panel, PanelStatus } from "@/lib/studio/types";

export const PANEL_STATUS_FLOW: Record<PanelStatus, PanelStatus[]> = {
  draft: ["queued", "generating", "error"],
  queued: ["generating", "error"],
  generating: ["success", "error"],
  success: ["generating", "error"],
  error: ["queued", "generating"],
};

export function canTransitionPanelStatus(from: PanelStatus, to: PanelStatus) {
  return from === to || PANEL_STATUS_FLOW[from].includes(to);
}

export function markPanelQueued(panel: Panel): Panel {
  if (!canTransitionPanelStatus(panel.status, "queued")) {
    return panel;
  }

  return {
    ...panel,
    status: "queued",
    errorMessage: undefined,
  };
}

export function markPanelGenerating(panel: Panel): Panel {
  if (!canTransitionPanelStatus(panel.status, "generating")) {
    return panel;
  }

  return {
    ...panel,
    status: "generating",
    errorMessage: undefined,
  };
}

export function markPanelGenerationFailed(
  panel: Panel,
  errorMessage: string,
): Panel {
  return {
    ...panel,
    status: "error",
    errorMessage,
  };
}
