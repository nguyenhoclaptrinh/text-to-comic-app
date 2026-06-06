/**
 * @file TopBar.tsx
 * @description Studio header with project status, generation, and export actions.
 */

import { Download, Loader2, Wand2, Settings } from "lucide-react";

import type { GenerationSummary } from "@/lib/studio/types";

export function TopBar({
  projectTitle,
  generationSummary,
  isGeneratingAll,
  onGenerateAll,
  onExport,
  onOpenSettings,
}: {
  projectTitle: string;
  generationSummary: GenerationSummary;
  isGeneratingAll: boolean;
  onGenerateAll: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#101014]/95 px-4 lg:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">
            {projectTitle}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 border border-zinc-800/60 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tự động lưu
          </span>
        </div>
        <div
          className="mt-1 flex items-center gap-3 text-xs text-zinc-500"
          aria-live="polite"
        >
          <span>
            Đã vẽ {generationSummary.done}/{generationSummary.total} khung hình
          </span>
          {generationSummary.errors > 0 ? (
            <span className="text-red-300">
              {generationSummary.errors} khung hình lỗi cần vẽ lại
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Cấu hình API Keys"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Xuất truyện</span>
        </button>
        <button
          type="button"
          onClick={onGenerateAll}
          disabled={isGeneratingAll}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGeneratingAll ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Wand2 size={16} />
          )}
          <span className="hidden sm:inline">Vẽ Toàn bộ</span>
        </button>
      </div>
    </header>
  );
}
