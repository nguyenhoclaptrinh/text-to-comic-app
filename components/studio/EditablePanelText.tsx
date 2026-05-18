/**
 * @file EditablePanelText.tsx
 * @description Editable text fields for storyboard prompt and dialogue.
 */

import type { Panel } from "@/lib/studio/types";

export function EditablePanelText({
  panel,
  onUpdate,
}: {
  panel: Panel;
  onUpdate: (patch: Partial<Panel>) => void;
}) {
  return (
    <>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Scene prompt
      </label>
      <textarea
        aria-label={`Scene prompt for panel ${panel.orderIndex}`}
        value={panel.scenePrompt}
        onChange={(event) => onUpdate({ scenePrompt: event.target.value })}
        className="mb-4 min-h-24 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
      />

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Dialogue
      </label>
      <textarea
        aria-label={`Dialogue for panel ${panel.orderIndex}`}
        value={panel.dialogue}
        onChange={(event) => onUpdate({ dialogue: event.target.value })}
        className="mb-4 min-h-16 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
      />
    </>
  );
}
