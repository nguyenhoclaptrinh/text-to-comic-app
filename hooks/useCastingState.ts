/**
 * @file useCastingState.ts
 * @description Hook managing characters profile casting state and updates.
 */

import { useState } from "react";
import { createCharacter } from "@/lib/studio/factories";
import { updateCharacterProfile } from "@/lib/studio/utils";
import type { Character } from "@/lib/studio/types";

export function useCastingState(initialCharacters: Character[]) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);

  function addCharacter() {
    setCharacters((current) => [
      ...current,
      createCharacter(current.length + 1),
    ]);
  }

  function updateCharacter(characterId: string, patch: Partial<Character>) {
    setCharacters((current) =>
      current.map((character) =>
        updateCharacterProfile(character, characterId, patch),
      ),
    );
  }

  return {
    characters,
    setCharacters,
    addCharacter,
    updateCharacter,
  };
}
