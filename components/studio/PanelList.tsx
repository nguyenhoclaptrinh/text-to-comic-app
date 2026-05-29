/**
 * @file PanelList.tsx
 * @description Side list for quickly selecting comic panels.
 */

import type { Panel } from "@/lib/studio/types";

export function PanelList({
  panels,
  selectedPanelId,
  onSelectPanel,
  className = "",
}: {
  panels: Panel[];
  selectedPanelId: string;
  onSelectPanel: (panelId: string) => void;
  className?: string;
}) {
  return (
    <aside className={`border-l border-zinc-800 bg-[#111114] p-4 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Danh sách Khung hình
      </h2>
      <div className="space-y-2">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            onClick={() => onSelectPanel(panel.id)}
            className={`flex h-12 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition-colors ${
              selectedPanelId === panel.id
                ? "border-violet-400/60 bg-violet-500/15 text-violet-200"
                : "border-zinc-800 bg-[#18181b] text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <span>Khung hình {panel.orderIndex}</span>
            <span className="text-xs text-zinc-500">
              {panel.bubbles.length} bong bóng
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
