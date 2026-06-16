/**
 * @file BubbleTools.tsx
 * @description Speech bubble editing controls for the comic editor.
 */

import { Plus, Trash2 } from "lucide-react";

import type { Bubble } from "@/lib/studio/types";

export function BubbleTools({
  selectedBubble,
  onAddBubble,
  onUpdateBubble,
  onDeleteBubble,
  className = "",
}: {
  selectedBubble?: Bubble;
  onAddBubble: () => void;
  onUpdateBubble: (patch: Partial<Bubble>) => void;
  onDeleteBubble: () => void;
  className?: string;
}) {
  return (
    <aside className={`border-r border-border-main bg-surface p-4 transition-colors duration-200 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Công cụ Bong bóng
      </h2>
      <button
        type="button"
        onClick={onAddBubble}
        className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-sm font-semibold text-white hover:bg-violet-400 transition-colors"
      >
        <Plus size={16} />
        Thêm Bong bóng thoại
      </button>

      <div className="rounded-xl border border-border-main bg-surface-elevated/40 p-4">
        <div className="mb-3 text-sm font-semibold text-text-primary">
          Bong bóng được chọn
        </div>
        {selectedBubble ? (
          <SelectedBubbleForm
            selectedBubble={selectedBubble}
            onUpdateBubble={onUpdateBubble}
            onDeleteBubble={onDeleteBubble}
          />
        ) : (
          <p className="text-sm leading-6 text-text-secondary">
            Chọn một bong bóng trên hình preview hoặc thêm mới một bong bóng
            thoại.
          </p>
        )}
      </div>
    </aside>
  );
}

function SelectedBubbleForm({
  selectedBubble,
  onUpdateBubble,
  onDeleteBubble,
}: {
  selectedBubble: Bubble;
  onUpdateBubble: (patch: Partial<Bubble>) => void;
  onDeleteBubble: () => void;
}) {
  return (
    <>
      <label
        className="mb-2 block text-xs font-medium text-text-secondary"
        htmlFor="bubble-text"
      >
        Nội dung hội thoại
      </label>
      <textarea
        id="bubble-text"
        value={selectedBubble.text}
        onChange={(event) => onUpdateBubble({ text: event.target.value })}
        className="mb-4 min-h-24 w-full resize-none rounded-lg border border-border-main bg-background p-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Nhập lời thoại nhân vật..."
      />

      <div className="mb-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-text-secondary">
            <span>Cỡ chữ</span>
            <span className="font-semibold text-text-primary">
              {selectedBubble.fontSize || 14}px
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="30"
            value={selectedBubble.fontSize || 14}
            onChange={(e) =>
              onUpdateBubble({ fontSize: parseInt(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-elevated accent-primary"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-text-secondary">
            <span>Chiều rộng</span>
            <span className="font-semibold text-text-primary">
              {selectedBubble.width}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={selectedBubble.width}
            onChange={(e) =>
              onUpdateBubble({ width: parseInt(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-elevated accent-primary"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-text-secondary">
            <span>Chiều cao</span>
            <span className="font-semibold text-text-primary">
              {selectedBubble.height}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="80"
            value={selectedBubble.height}
            onChange={(e) =>
              onUpdateBubble({ height: parseInt(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-elevated accent-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
        <div className="rounded-md bg-background border border-border-main p-2 text-center">
          Tọa độ X: {selectedBubble.x}%
        </div>
        <div className="rounded-md bg-background border border-border-main p-2 text-center">
          Tọa độ Y: {selectedBubble.y}%
        </div>
      </div>

      <button
        type="button"
        onClick={onDeleteBubble}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-650 dark:text-red-200 hover:bg-red-500/20 transition-colors"
      >
        <Trash2 size={14} />
        Xóa Bong bóng thoại
      </button>
    </>
  );
}
