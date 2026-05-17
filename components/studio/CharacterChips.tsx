/**
 * @file CharacterChips.tsx
 * @description Character badges shown on storyboard panels.
 */

import type { Character, Panel } from "@/lib/studio/types";

export function CharacterChips({
  panel,
  characters,
}: {
  panel: Panel;
  characters: Character[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {panel.characterIds.map((characterId) => {
        const character = characters.find((item) => item.id === characterId);
        return (
          <span
            key={characterId}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
          >
            {character?.name ?? characterId}
          </span>
        );
      })}
    </div>
  );
}
