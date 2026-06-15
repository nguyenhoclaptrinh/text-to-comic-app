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
          Khung {panel.orderIndex}
        </button>
        <StatusBadge status={panel.status} />
      </div>
      <div
        className={`relative w-full overflow-hidden rounded-lg border border-zinc-700 bg-gradient-to-br ${panel.imageTone}`}
        style={{ aspectRatio: "900 / 520" }}
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
            id={`bubble-${bubble.id}`}
            type="button"
            aria-label={`Sửa bong bóng thoại: ${bubble.text}`}
            onPointerDown={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest(".bubble-resize-handle")) {
                return;
              }
              const bubbleBox = event.currentTarget.getBoundingClientRect();
              onSelectPanel(panel.id);
              onSelectBubble(bubble.id);
              onStartDrag({
                panelId: panel.id,
                bubbleId: bubble.id,
                offsetX: event.clientX - bubbleBox.left,
                offsetY: event.clientY - bubbleBox.top,
                bubbleWidth: bubble.width,
                bubbleHeight: bubble.height,
                mode: "move",
              });
            }}
            className={`comic-text absolute rounded-[24px] rounded-bl-md border-2 border-black bg-white p-3 text-left font-bold leading-5 text-zinc-950 shadow-lg transition ${
              selectedBubbleId === bubble.id ? "ring-2 ring-violet-400" : ""
            }`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.width}%`,
              minHeight: `${bubble.height}%`,
              fontSize: bubble.fontSize ? `${bubble.fontSize}px` : "14px",
            }}
          >
            <span className="block pr-2 pb-2">{bubble.text}</span>
            
            {/* Đuôi bong bóng thoại phong cách truyện tranh */}
            <svg
              className="absolute -bottom-[15px] left-6 h-[16px] w-[25px] pointer-events-none"
              viewBox="0 0 25 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 12,-3 L 2,14 L 22,-3 Z"
                fill="white"
              />
              <path
                d="M 12,0 L 2,14 L 22,0"
                stroke="black"
                strokeWidth="2"
              />
            </svg>
            
            {selectedBubbleId === bubble.id && (
              <span
                role="button"
                aria-label="Kéo để thay đổi kích thước"
                className="bubble-resize-handle absolute bottom-1 right-1 cursor-se-resize p-1 hover:scale-125 transition-transform"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const bubbleBox = event.currentTarget.parentElement!.getBoundingClientRect();
                  onSelectPanel(panel.id);
                  onSelectBubble(bubble.id);
                  onStartDrag({
                    panelId: panel.id,
                    bubbleId: bubble.id,
                    offsetX: event.clientX - bubbleBox.left,
                    offsetY: event.clientY - bubbleBox.top,
                    bubbleWidth: bubble.width,
                    bubbleHeight: bubble.height,
                    mode: "resize",
                  });
                }}
              >
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-zinc-400 hover:text-violet-500">
                  <line x1="8" y1="2" x2="2" y2="8" />
                  <line x1="8" y1="5" x2="5" y2="8" />
                </svg>
              </span>
            )}
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
        ? "Khung này cần vẽ lại"
        : "Hãy vẽ ảnh trước khi xuất"}
    </div>
  );
}
