/**
 * @file useBubbleDragState.ts
 * @description Hook managing speech bubble drag interactions and coordinates scaling.
 */

import { useState } from "react";
import { nextBubbleCoordinate } from "@/lib/studio/utils";
import type { DragState, Bubble } from "@/lib/studio/types";

export function useBubbleDragState(
  updateBubble: (
    panelId: string,
    bubbleId: string,
    patch: Partial<Bubble>,
  ) => void,
) {
  const [dragging, setDragging] = useState<DragState | null>(null);

  function handleBubbleMove(
    event: React.PointerEvent<HTMLDivElement>,
    panelId: string,
  ) {
    if (!dragging || dragging.panelId !== panelId) {
      return;
    }

    const stage = event.currentTarget.getBoundingClientRect();
    if (dragging.mode === "resize") {
      const bubbleEl = document.getElementById(`bubble-${dragging.bubbleId}`);
      if (!bubbleEl) return;
      const bubbleBox = bubbleEl.getBoundingClientRect();

      const currentMouseXInStage = event.clientX - stage.left;
      const currentMouseYInStage = event.clientY - stage.top;

      const bubbleLeftInStage = bubbleBox.left - stage.left;
      const bubbleTopInStage = bubbleBox.top - stage.top;

      const newWidth = ((currentMouseXInStage - bubbleLeftInStage) / stage.width) * 100;
      const newHeight = ((currentMouseYInStage - bubbleTopInStage) / stage.height) * 100;

      updateBubble(panelId, dragging.bubbleId, {
        width: Math.max(10, Math.min(100, Math.round(newWidth))),
        height: Math.max(5, Math.min(80, Math.round(newHeight))),
      });
    } else {
      updateBubble(panelId, dragging.bubbleId, {
        x: nextBubbleCoordinate(
          event.clientX,
          stage.left,
          dragging.offsetX,
          stage.width,
          dragging.bubbleWidth,
        ),
        y: nextBubbleCoordinate(
          event.clientY,
          stage.top,
          dragging.offsetY,
          stage.height,
          dragging.bubbleHeight,
        ),
      });
    }
  }

  return {
    dragging,
    setDragging,
    handleBubbleMove,
  };
}
