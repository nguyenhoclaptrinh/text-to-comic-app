/**
 * @file ComicPanelCanvas.tsx
 * @description Draggable speech bubble canvas for one comic panel.
 */

import { ComicPanelArt } from "@/components/studio/PanelArtwork";
import { StatusBadge } from "@/components/studio/StatusBadge";
import type { DragState, Panel } from "@/lib/studio/types";

export function ComicPanelCanvas({
  panel,
  selectedBubbleId,
  dragging,
  onSelectPanel,
  onSelectBubble,
  onStartDrag,
  onStopDrag,
  onBubbleMove,
}: {
  panel: Panel;
  selectedBubbleId: string;
  dragging: DragState | null;
  onSelectPanel: (panelId: string) => void;
  onSelectBubble: (bubbleId: string) => void;
  onStartDrag: (dragState: DragState) => void;
  onStopDrag: () => void;
  onBubbleMove: (
    event: React.PointerEvent<HTMLDivElement>,
    panelId: string,
  ) => void;
}) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelectPanel(panel.id)}
          className="text-sm font-semibold text-zinc-100"
        >
          Panel {panel.orderIndex}
        </button>
        <StatusBadge status={panel.status} />
      </div>
      <div
        className={`relative h-[320px] overflow-hidden rounded-lg border border-zinc-700 bg-gradient-to-br ${panel.imageTone}`}
        onPointerMove={(event) => onBubbleMove(event, panel.id)}
        onPointerUp={onStopDrag}
        onPointerLeave={() => {
          if (dragging?.panelId === panel.id) {
            onStopDrag();
          }
        }}
      >
        <ComicPanelArt panel={panel} />
        {panel.bubbles.map((bubble) => (
          <button
            key={bubble.id}
            type="button"
            aria-label={`Edit speech bubble: ${bubble.text}`}
            onPointerDown={(event) => {
              const bubbleBox = event.currentTarget.getBoundingClientRect();
              onSelectPanel(panel.id);
              onSelectBubble(bubble.id);
              onStartDrag({
                panelId: panel.id,
                bubbleId: bubble.id,
                offsetX: event.clientX - bubbleBox.left,
                offsetY: event.clientY - bubbleBox.top,
              });
            }}
            className={`comic-text absolute rounded-[24px] rounded-bl-md border-2 border-black bg-white p-3 text-left text-sm font-bold leading-5 text-zinc-950 shadow-lg transition ${
              selectedBubbleId === bubble.id ? "ring-2 ring-violet-400" : ""
            }`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.width}%`,
              minHeight: `${bubble.height}%`,
            }}
          >
            {bubble.text}
          </button>
        ))}
        {panel.status !== "success" ? (
          <MissingImageOverlay status={panel.status} />
        ) : null}
      </div>
    </article>
  );
}

function MissingImageOverlay({ status }: { status: Panel["status"] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm text-zinc-200">
      {status === "error"
        ? "Panel image missing"
        : "Generate panel before export"}
    </div>
  );
}
