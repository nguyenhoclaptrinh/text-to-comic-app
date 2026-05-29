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
  className = "",
}: {
  characters: Character[];
  onAddCharacter: () => void;
  onUpdateCharacter: (characterId: string, patch: Partial<Character>) => void;
  className?: string;
}) {
  return (
    <aside className={`border-r border-zinc-800 bg-[#111114] p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Casting Nhân vật
        </h2>
        <button
          type="button"
          onClick={onAddCharacter}
          aria-label="Thêm nhân vật"
          title="Thêm nhân vật"
          className="flex size-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-colors"
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
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: character.color }}
        >
          {character.name.slice(0, 1) || "C"}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            aria-label="Tên nhân vật"
            value={character.name}
            placeholder="Tên nhân vật..."
            onChange={(event) => onUpdate({ name: event.target.value })}
            className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm font-semibold text-zinc-100 focus:border-violet-500 focus:outline-none"
          />
          <input
            aria-label="Vai trò nhân vật"
            value={character.role}
            placeholder="Vai trò (vd: Nhân vật chính)"
            onChange={(event) => onUpdate({ role: event.target.value })}
            className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>
      <textarea
        aria-label="Mô tả ngoại hình nhân vật"
        value={character.description}
        placeholder="Mô tả ngoại hình (vd: Mặc áo khoác đen, tóc ngắn đỏ, đeo kính)..."
        onChange={(event) => onUpdate({ description: event.target.value })}
        className="min-h-20 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs leading-5 text-zinc-300 focus:border-violet-500 focus:outline-none"
      />
      <button
        type="button"
        className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:bg-zinc-900 transition-colors"
      >
        <Upload size={13} />
        Ảnh mẫu (Reference)
      </button>
    </article>
  );
}
