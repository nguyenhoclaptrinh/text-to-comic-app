/**
 * @file BubbleTools.tsx
 * @description Speech bubble editing controls for the comic editor.
 */

import { Plus, Trash2 } from "lucide-react";

import type { Bubble } from "@/lib/studio/types";

export function BubbleTools({
  selectedBubble,
  onAddBubble,
  onUpdateBubble,
  onDeleteBubble,
}: {
  selectedBubble?: Bubble;
  onAddBubble: () => void;
  onUpdateBubble: (patch: Partial<Bubble>) => void;
  onDeleteBubble: () => void;
}) {
  return (
    <aside className="hidden border-r border-zinc-800 bg-[#111114] p-4 xl:block">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Bubble Tools
      </h2>
      <button
        type="button"
        onClick={onAddBubble}
        className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-sm font-semibold text-white hover:bg-violet-400"
      >
        <Plus size={16} />
        Add Bubble
      </button>

      <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
        <div className="mb-3 text-sm font-semibold">Selected Bubble</div>
        {selectedBubble ? (
          <SelectedBubbleForm
            selectedBubble={selectedBubble}
            onUpdateBubble={onUpdateBubble}
            onDeleteBubble={onDeleteBubble}
          />
        ) : (
          <p className="text-sm leading-6 text-zinc-400">
            Select a bubble on the preview or add one.
          </p>
        )}
      </div>
    </aside>
  );
}

function SelectedBubbleForm({
  selectedBubble,
  onUpdateBubble,
  onDeleteBubble,
}: {
  selectedBubble: Bubble;
  onUpdateBubble: (patch: Partial<Bubble>) => void;
  onDeleteBubble: () => void;
}) {
  return (
    <>
      <label
        className="mb-2 block text-xs font-medium text-zinc-500"
        htmlFor="bubble-text"
      >
        Text
      </label>
      <textarea
        id="bubble-text"
        value={selectedBubble.text}
        onChange={(event) => onUpdateBubble({ text: event.target.value })}
        className="mb-3 min-h-24 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm text-zinc-100"
      />
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div className="rounded-md bg-zinc-950 p-2">x: {selectedBubble.x}%</div>
        <div className="rounded-md bg-zinc-950 p-2">y: {selectedBubble.y}%</div>
        <div className="rounded-md bg-zinc-950 p-2">
          w: {selectedBubble.width}%
        </div>
        <div className="rounded-md bg-zinc-950 p-2">
          h: {selectedBubble.height}%
        </div>
      </div>
      <button
        type="button"
        onClick={onDeleteBubble}
        className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 text-sm text-red-200 hover:bg-red-500/10"
      >
        <Trash2 size={14} />
        Delete Bubble
      </button>
    </>
  );
}
