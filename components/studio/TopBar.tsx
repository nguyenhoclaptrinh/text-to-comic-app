/**
 * @file TopBar.tsx
 * @description Studio header with project status, generation, and export actions.
 */

import { Download, Loader2, Wand2 } from "lucide-react";

import type { GenerationSummary } from "@/lib/studio/types";

export function TopBar({
  projectTitle,
  generationSummary,
  isGeneratingAll,
  onGenerateAll,
  onExport,
}: {
  projectTitle: string;
  generationSummary: GenerationSummary;
  isGeneratingAll: boolean;
  onGenerateAll: () => void;
  onExport: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#101014]/95 px-4 lg:px-6">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {projectTitle}
        </div>
        <div
          className="mt-1 flex items-center gap-3 text-xs text-zinc-500"
          aria-live="polite"
        >
          <span>
            {generationSummary.done}/{generationSummary.total} panels done
          </span>
          {generationSummary.errors > 0 ? (
            <span className="text-red-300">
              {generationSummary.errors} needs retry
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
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
          <span className="hidden sm:inline">Generate All</span>
        </button>
      </div>
    </header>
  );
}
