/**
 * @file CharacterChips.tsx
 * @description Character badges shown on storyboard panels.
 */

import type { Character, Panel } from "@/lib/studio/types";
import { slugifyCharacterName } from "@/lib/studio/storyboard";

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
        const character = characters.find(
          (item) =>
            item.id === characterId ||
            slugifyCharacterName(item.name) === characterId,
        );
        const label = character?.name ?? prettifyCharacterId(characterId);
        if (!label) {
          return null;
        }

        return (
          <span
            key={characterId}
            className="rounded-full border border-border-main bg-surface-elevated px-3 py-1 text-xs text-text-secondary"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function prettifyCharacterId(characterId: string) {
  if (characterId === "unknown-character") {
    return "";
  }

  return characterId
    .split("-")
    .filter((word) => word.length > 1)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
