/**
 * @file StoryboardPanelCard.tsx
 * @description Editable storyboard panel card with generation controls.
 */

import { Trash2 } from "lucide-react";

import { CharacterChips } from "@/components/studio/CharacterChips";
import { EditablePanelText } from "@/components/studio/EditablePanelText";
import { PanelImageControls } from "@/components/studio/PanelImageControls";
import { StatusBadge } from "@/components/studio/StatusBadge";
import type { Character, Panel } from "@/lib/studio/types";

export function StoryboardPanelCard({
  panel,
  characters,
  selected,
  disabled,
  canDelete,
  onSelect,
  onUpdate,
  onGenerate,
  onDelete,
}: {
  panel: Panel;
  characters: Character[];
  selected: boolean;
  disabled: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Panel>) => void;
  onGenerate: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`grid overflow-hidden rounded-xl border bg-[#18181b] shadow-lg lg:grid-cols-[minmax(0,1fr)_360px] ${
        selected ? "border-violet-400/60" : "border-zinc-800"
      }`}
    >
      <PanelTextEditor
        panel={panel}
        characters={characters}
        canDelete={canDelete}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
      <PanelImageControls
        panel={panel}
        disabled={disabled}
        onGenerate={onGenerate}
      />
    </article>
  );
}

function PanelTextEditor({
  panel,
  characters,
  canDelete,
  onSelect,
  onUpdate,
  onDelete,
}: {
  panel: Panel;
  characters: Character[];
  canDelete: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Panel>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-2 rounded-md text-left text-sm font-semibold text-white"
        >
          <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
            PANEL {panel.orderIndex}
          </span>
          <StatusBadge status={panel.status} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label={`Delete panel ${panel.orderIndex}`}
          className="flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <EditablePanelText panel={panel} onUpdate={onUpdate} />
      <CharacterChips panel={panel} characters={characters} />
    </div>
  );
}
