/**
 * @file StoryboardWorkspace.tsx
 * @description Storyboard editing workspace with character casting and panel cards.
 */

import { AlertTriangle, MessageCircle, Plus, Upload } from "lucide-react";

import { StoryboardPanelCard } from "@/components/studio/StoryboardPanelCard";
import type { Character, Panel } from "@/lib/studio/types";

export function StoryboardWorkspace({
  characters,
  panels,
  selectedPanelId,
  isGeneratingAll,
  onAddCharacter,
  onSelectPanel,
  onUpdatePanel,
  onGeneratePanel,
  onGoToComic,
}: {
  characters: Character[];
  panels: Panel[];
  selectedPanelId: string;
  isGeneratingAll: boolean;
  onAddCharacter: () => void;
  onSelectPanel: (panelId: string) => void;
  onUpdatePanel: (panelId: string, patch: Partial<Panel>) => void;
  onGeneratePanel: (panelId: string) => void;
  onGoToComic: () => void;
}) {
  const hasBackendError = panels.some((panel) => panel.status === "error");

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[288px_minmax(0,1fr)]">
      <CharacterCastingPanel
        characters={characters}
        onAddCharacter={onAddCharacter}
      />
      <section className="min-w-0 overflow-y-auto px-4 py-5 lg:px-6">
        {hasBackendError ? <ImageBackendAlert /> : null}
        <StoryboardHeader onGoToComic={onGoToComic} />
        <div className="space-y-4 pb-8">
          {panels.map((panel) => (
            <StoryboardPanelCard
              key={panel.id}
              panel={panel}
              characters={characters}
              selected={panel.id === selectedPanelId}
              disabled={isGeneratingAll}
              onSelect={() => onSelectPanel(panel.id)}
              onUpdate={(patch) => onUpdatePanel(panel.id, patch)}
              onGenerate={() => onGeneratePanel(panel.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CharacterCastingPanel({
  characters,
  onAddCharacter,
}: {
  characters: Character[];
  onAddCharacter: () => void;
}) {
  return (
    <aside className="hidden border-r border-zinc-800 bg-[#111114] p-4 lg:block">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Casting
        </h2>
        <button
          type="button"
          onClick={onAddCharacter}
          aria-label="Add character"
          className="flex size-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </aside>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#18181b] p-3">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-full text-sm font-semibold"
          style={{ backgroundColor: character.color }}
        >
          {character.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{character.name}</div>
          <div className="truncate text-xs text-zinc-500">{character.role}</div>
        </div>
      </div>
      <p className="text-xs leading-5 text-zinc-400">{character.description}</p>
      <button
        type="button"
        className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-2 text-xs text-zinc-300 hover:bg-zinc-900"
      >
        <Upload size={13} />
        Reference
      </button>
    </article>
  );
}

function ImageBackendAlert() {
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={17} />
      <div>
        <div className="font-semibold">Image backend needs attention</div>
        <div className="mt-1 text-red-100/80">
          Failed panels keep their storyboard text and can be retried one by
          one.
        </div>
      </div>
    </div>
  );
}

function StoryboardHeader({ onGoToComic }: { onGoToComic: () => void }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold">Storyboard Editor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review prompts, dialogue, and panel status.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToComic}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium hover:bg-zinc-800"
      >
        <MessageCircle size={16} />
        Open Comic Editor
      </button>
    </div>
  );
}
