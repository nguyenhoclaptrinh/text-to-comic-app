/**
 * @file StoryboardPanelCard.tsx
 * @description Editable storyboard panel card with generation controls.
 */

import { Trash2, ChevronUp, ChevronDown } from "lucide-react";

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
  canMoveUp,
  canMoveDown,
  onSelect,
  onUpdate,
  onGenerate,
  onDelete,
  onMove,
}: {
  panel: Panel;
  characters: Character[];
  selected: boolean;
  disabled: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Panel>) => void;
  onGenerate: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  return (
    <article
      className={`grid overflow-hidden rounded-xl border bg-surface shadow-lg transition-all duration-200 lg:grid-cols-[minmax(0,1fr)_360px] ${
        selected ? "border-primary/60" : "border-border-main"
      }`}
    >
      <PanelTextEditor
        panel={panel}
        characters={characters}
        canDelete={canDelete}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMove={onMove}
      />
      <PanelImageControls
        panel={panel}
        disabled={disabled}
        onGenerate={onGenerate}
        onUpdate={onUpdate}
      />
    </article>
  );
}

function PanelTextEditor({
  panel,
  characters,
  canDelete,
  canMoveUp,
  canMoveDown,
  onSelect,
  onUpdate,
  onDelete,
  onMove,
}: {
  panel: Panel;
  characters: Character[];
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Panel>) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-2 rounded-md text-left text-sm font-semibold text-text-primary"
        >
          <span className="rounded-md bg-surface-elevated px-2 py-1 text-xs text-text-secondary border border-border-main">
            Khung {panel.orderIndex}
          </span>
          <StatusBadge status={panel.status} />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={!canMoveUp}
            aria-label={`Move panel ${panel.orderIndex} up`}
            className="flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30 transition"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={!canMoveDown}
            aria-label={`Move panel ${panel.orderIndex} down`}
            className="flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30 transition"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            aria-label={`Delete panel ${panel.orderIndex}`}
            className="flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <EditablePanelText panel={panel} onUpdate={onUpdate} />
      <CharacterChips panel={panel} characters={characters} />
    </div>
  );
}
