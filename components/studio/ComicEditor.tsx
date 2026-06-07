/**
 * @file ComicEditor.tsx
 * @description Comic editor screen with page selector, speech bubble tools, preview canvas, and panel list.
 */

import { useState } from "react";
import { Save, MessageSquare, Layers } from "lucide-react";

import { BubbleTools } from "@/components/studio/BubbleTools";
import { ComicPanelCanvas } from "@/components/studio/ComicPanelCanvas";
import { PanelList } from "@/components/studio/PanelList";
import { PageSelector } from "@/components/studio/PageSelector";
import type { Bubble, DragState, Page, Panel } from "@/lib/studio/types";

export function ComicEditor({
  pages,
  activePageId,
  panels,
  selectedPanelId,
  selectedBubbleId,
  selectedBubble,
  dragging,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onSelectPanel,
  onSelectBubble,
  onAddBubble,
  onUpdateBubble,
  onDeleteBubble,
  onStartDrag,
  onStopDrag,
  onBubbleMove,
}: {
  pages: Page[];
  activePageId: string;
  panels: Panel[];
  selectedPanelId: string;
  selectedBubbleId: string;
  selectedBubble?: Bubble;
  dragging: DragState | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onSelectPanel: (panelId: string) => void;
  onSelectBubble: (bubbleId: string) => void;
  onAddBubble: (panelId: string) => void;
  onUpdateBubble: (
    panelId: string,
    bubbleId: string,
    patch: Partial<Bubble>,
  ) => void;
  onDeleteBubble: (panelId: string, bubbleId: string) => void;
  onStartDrag: (dragState: DragState) => void;
  onStopDrag: () => void;
  onBubbleMove: (
    event: React.PointerEvent<HTMLDivElement>,
    panelId: string,
  ) => void;
}) {
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const selectedPanel =
    panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_260px]">
      {/* BubbleTools (Sidebar tĩnh trên màn hình lớn) */}
      <BubbleTools
        selectedBubble={selectedBubble}
        onAddBubble={() => onAddBubble(selectedPanel.id)}
        onUpdateBubble={(patch) =>
          updateSelectedBubble(selectedPanel, selectedBubble, patch)
        }
        onDeleteBubble={() =>
          deleteSelectedBubble(selectedPanel, selectedBubble)
        }
        className="hidden xl:block"
      />

      {/* Vùng Canvas chính ở giữa */}
      <section className="overflow-y-auto px-4 py-5 lg:px-6 pb-24 xl:pb-8">
        <ComicEditorHeader />

        <PageSelector
          pages={pages}
          activePageId={activePageId}
          onSelectPage={onSelectPage}
          onAddPage={onAddPage}
          onDeletePage={onDeletePage}
        />

        <div className="mx-auto max-w-3xl space-y-5 pb-8">
          {panels.map((panel) => (
            <ComicPanelCanvas
              key={panel.id}
              panel={panel}
              selectedBubbleId={selectedBubbleId}
              dragging={dragging}
              onSelectPanel={onSelectPanel}
              onSelectBubble={(bubbleId) => {
                onSelectBubble(bubbleId);
                // Tự động mở bottom sheet điều khiển bong bóng thoại trên di động để thuận tiện chỉnh sửa
                if (window.innerWidth < 1280) {
                  setIsBubbleOpen(true);
                }
              }}
              onStartDrag={onStartDrag}
              onStopDrag={onStopDrag}
              onBubbleMove={onBubbleMove}
            />
          ))}
        </div>
      </section>

      {/* PanelList (Sidebar tĩnh trên màn hình lớn) */}
      <PanelList
        panels={panels}
        selectedPanelId={selectedPanelId}
        onSelectPanel={onSelectPanel}
        className="hidden xl:block"
      />

      {/* ============================================================== */}
      {/* RESPONSIVE UI: FLOATING ACTION DOCK & OVERLAY DRAWERS          */}
      {/* ============================================================== */}

      {/* Floating Action Dock cho tablet & mobile (< 1280px) */}
      <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-border-main bg-surface/90 p-2 shadow-2xl backdrop-blur-md transition-colors duration-200 xl:hidden">
        <button
          type="button"
          onClick={() => setIsBubbleOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-surface-elevated px-4 text-sm font-medium text-text-secondary hover:bg-surface active:scale-95 transition"
        >
          <MessageSquare size={16} className="text-primary" />
          <span>Lời thoại</span>
        </button>
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-surface-elevated px-4 text-sm font-medium text-text-secondary hover:bg-surface active:scale-95 transition"
        >
          <Layers size={16} className="text-primary" />
          <span>Danh sách</span>
        </button>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 active:scale-95 transition"
        >
          <Save size={16} />
          <span>Lưu</span>
        </button>
      </div>

      {/* Bottom Sheet cho Bubble Tools trên mobile */}
      {isBubbleOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm xl:hidden">
          <div className="flex-1" onClick={() => setIsBubbleOpen(false)} />
          <div className="relative flex max-h-[80vh] flex-col rounded-t-2xl border-t border-border-main bg-surface-elevated p-4 shadow-2xl">
            {/* Thanh kéo handle bar giả */}
            <div
              className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border-main"
              onClick={() => setIsBubbleOpen(false)}
            />
            <div className="overflow-y-auto pb-8">
              <BubbleTools
                selectedBubble={selectedBubble}
                onAddBubble={() => onAddBubble(selectedPanel.id)}
                onUpdateBubble={(patch) =>
                  updateSelectedBubble(selectedPanel, selectedBubble, patch)
                }
                onDeleteBubble={() =>
                  deleteSelectedBubble(selectedPanel, selectedBubble)
                }
                className="border-none bg-transparent p-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Right Drawer cho Panel List trên mobile */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm xl:hidden">
          <div className="flex-1" onClick={() => setIsPanelOpen(false)} />
          <div className="relative flex h-full w-[280px] flex-col border-l border-border-main bg-surface-elevated p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border-main pb-3">
              <span className="font-semibold text-text-primary">
                Danh sách khung
              </span>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-surface hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PanelList
                panels={panels}
                selectedPanelId={selectedPanelId}
                onSelectPanel={(panelId) => {
                  onSelectPanel(panelId);
                  setIsPanelOpen(false);
                }}
                className="border-none bg-transparent p-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function updateSelectedBubble(
    panel: Panel,
    bubble: Bubble | undefined,
    patch: Partial<Bubble>,
  ) {
    if (!bubble) {
      return;
    }

    onUpdateBubble(panel.id, bubble.id, patch);
  }

  function deleteSelectedBubble(panel: Panel, bubble: Bubble | undefined) {
    if (!bubble) {
      return;
    }

    onDeleteBubble(panel.id, bubble.id);
  }
}

function ComicEditorHeader() {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          Chỉnh truyện
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Đặt bong bóng thoại lên từng khung ảnh và kiểm tra bản truyện trước
          khi xuất.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-main bg-surface-elevated px-3 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        <Save size={15} />
        Đã tự lưu
      </button>
    </div>
  );
}
