/**
 * @file ComicEditor.tsx
 * @description Comic editor screen with page selector, speech bubble tools, preview canvas, and panel list.
 */

import { Save } from "lucide-react";

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
  const selectedPanel =
    panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_260px]">
      <BubbleTools
        selectedBubble={selectedBubble}
        onAddBubble={() => onAddBubble(selectedPanel.id)}
        onUpdateBubble={(patch) =>
          updateSelectedBubble(selectedPanel, selectedBubble, patch)
        }
        onDeleteBubble={() =>
          deleteSelectedBubble(selectedPanel, selectedBubble)
        }
      />

      <section className="overflow-y-auto px-4 py-5 lg:px-6">
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
              onSelectBubble={onSelectBubble}
              onStartDrag={onStartDrag}
              onStopDrag={onStopDrag}
              onBubbleMove={onBubbleMove}
            />
          ))}
        </div>
      </section>

      <PanelList
        panels={panels}
        selectedPanelId={selectedPanelId}
        onSelectPanel={onSelectPanel}
      />
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
        <h1 className="text-xl font-semibold">Comic Editor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Speech bubbles are saved per panel.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        <Save size={15} />
        Save
      </button>
    </div>
  );
}
