import { Download, Loader2, Wand2, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border-main bg-surface/95 px-3 py-2 transition-colors duration-200 md:px-4 lg:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="max-w-[42vw] truncate text-sm font-semibold text-text-primary sm:max-w-none">
            {projectTitle}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-2.5 py-0.5 text-[10px] font-semibold text-text-secondary border border-border-main shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tự động lưu
          </span>
        </div>
        <div
          className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary"
          aria-live="polite"
        >
          <span>
            Đã vẽ {generationSummary.done}/{generationSummary.total} khung hình
          </span>
          {generationSummary.errors > 0 ? (
            <span className="text-red-500 dark:text-red-300 font-medium">
              {generationSummary.errors} khung hình lỗi cần vẽ lại
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-surface-elevated text-text-secondary hover:bg-surface hover:text-text-primary transition"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Cấu hình dịch vụ AI"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-surface-elevated text-text-secondary hover:bg-surface hover:text-text-primary transition"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-main bg-surface-elevated px-3 text-sm font-medium text-text-primary transition hover:bg-surface"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Xuất file</span>
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
          <span className="hidden sm:inline">Vẽ tất cả</span>
        </button>
      </div>
    </header>
  );
}

