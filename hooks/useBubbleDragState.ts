/**
 * @file useBubbleDragState.ts
 * @description Hook managing speech bubble drag interactions and coordinates scaling.
 */

import { useState } from "react";
import { DEFAULT_BUBBLE_HEIGHT, DEFAULT_BUBBLE_WIDTH } from "@/lib/studio/constants";
import { nextBubbleCoordinate } from "@/lib/studio/utils";
import type { DragState, Bubble } from "@/lib/studio/types";

export function useBubbleDragState(
  updateBubble: (panelId: string, bubbleId: string, patch: Partial<Bubble>) => void,
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

  return {
    dragging,
    setDragging,
    handleBubbleMove,
  };
}
