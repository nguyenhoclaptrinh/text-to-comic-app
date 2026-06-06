/**
 * @file EditablePanelText.tsx
 * @description Editable text fields for storyboard prompt and dialogue.
 */

import { useState, useEffect, useRef } from "react";
import type { Panel } from "@/lib/studio/types";

export function EditablePanelText({
  panel,
  onUpdate,
}: {
  panel: Panel;
  onUpdate: (patch: Partial<Panel>) => void;
}) {
  const [prevPanelId, setPrevPanelId] = useState(panel.id);
  const [localPrompt, setLocalPrompt] = useState(panel.scenePrompt);
  const [localDialogue, setLocalDialogue] = useState(panel.dialogue);

  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Adjust state during rendering when panel changes
  if (panel.id !== prevPanelId) {
    setPrevPanelId(panel.id);
    setLocalPrompt(panel.scenePrompt);
    setLocalDialogue(panel.dialogue);
  }

  // Clean up timers on unmount or when panel changes
  useEffect(() => {
    return () => {
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    };
  }, [panel.id]);

  const updatePrompt = (val: string) => {
    if (val !== panel.scenePrompt) {
      onUpdate({ scenePrompt: val });
    }
  };

  const updateDialogue = (val: string) => {
    if (val !== panel.dialogue) {
      onUpdate({ dialogue: val });
    }
  };

  const handlePromptChange = (val: string) => {
    setLocalPrompt(val);
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = setTimeout(() => {
      updatePrompt(val);
    }, 800);
  };

  const handleDialogueChange = (val: string) => {
    setLocalDialogue(val);
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    dialogueTimerRef.current = setTimeout(() => {
      updateDialogue(val);
    }, 800);
  };

  const handlePromptBlur = () => {
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    updatePrompt(localPrompt);
  };

  const handleDialogueBlur = () => {
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    updateDialogue(localDialogue);
  };

  return (
    <>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Scene prompt
      </label>
      <textarea
        aria-label={`Scene prompt for panel ${panel.orderIndex}`}
        value={localPrompt}
        onChange={(event) => handlePromptChange(event.target.value)}
        onBlur={handlePromptBlur}
        className="mb-4 min-h-24 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
      />

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Dialogue
      </label>
      <textarea
        aria-label={`Dialogue for panel ${panel.orderIndex}`}
        value={localDialogue}
        onChange={(event) => handleDialogueChange(event.target.value)}
        onBlur={handleDialogueBlur}
        className="mb-4 min-h-16 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
      />
    </>
  );
}
