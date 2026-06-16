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
    <aside className={`border-l border-border-main bg-surface p-4 transition-colors duration-200 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
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
                ? "border-primary/50 bg-primary/10 text-primary dark:text-violet-100 font-semibold"
                : "border-border-main bg-surface-elevated/40 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            }`}
          >
            <span>Khung hình {panel.orderIndex}</span>
            <span className="text-xs text-text-muted">
              {panel.bubbles.length} bong bóng
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
