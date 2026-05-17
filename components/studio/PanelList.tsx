/**
 * @file PanelList.tsx
 * @description Side list for quickly selecting comic panels.
 */

import type { Panel } from "@/lib/studio/types";

export function PanelList({
  panels,
  selectedPanelId,
  onSelectPanel,
}: {
  panels: Panel[];
  selectedPanelId: string;
  onSelectPanel: (panelId: string) => void;
}) {
  return (
    <aside className="hidden border-l border-zinc-800 bg-[#111114] p-4 xl:block">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Panel List
      </h2>
      <div className="space-y-2">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            onClick={() => onSelectPanel(panel.id)}
            className={`flex h-12 w-full items-center justify-between rounded-lg border px-3 text-left text-sm ${
              selectedPanelId === panel.id
                ? "border-violet-400/60 bg-violet-500/15"
                : "border-zinc-800 bg-[#18181b] hover:bg-zinc-900"
            }`}
          >
            <span>Panel {panel.orderIndex}</span>
            <span className="text-xs text-zinc-500">
              {panel.bubbles.length} bubbles
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
