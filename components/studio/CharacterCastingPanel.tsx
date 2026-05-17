/**
 * @file CharacterCastingPanel.tsx
 * @description Editable character casting panel for prompt consistency.
 */

import { Plus, Upload } from "lucide-react";

import type { Character } from "@/lib/studio/types";

export function CharacterCastingPanel({
  characters,
  onAddCharacter,
  onUpdateCharacter,
}: {
  characters: Character[];
  onAddCharacter: () => void;
  onUpdateCharacter: (characterId: string, patch: Partial<Character>) => void;
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
          <CharacterCard
            key={character.id}
            character={character}
            onUpdate={(patch) => onUpdateCharacter(character.id, patch)}
          />
        ))}
      </div>
    </aside>
  );
}

function CharacterCard({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
}) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-[#18181b] p-3">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ backgroundColor: character.color }}
        >
          {character.name.slice(0, 1) || "C"}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            aria-label="Character name"
            value={character.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm font-semibold text-zinc-100"
          />
          <input
            aria-label="Character role"
            value={character.role}
            onChange={(event) => onUpdate({ role: event.target.value })}
            className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-300"
          />
        </div>
      </div>
      <textarea
        aria-label="Character visual description"
        value={character.description}
        onChange={(event) => onUpdate({ description: event.target.value })}
        className="min-h-20 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs leading-5 text-zinc-300"
      />
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
