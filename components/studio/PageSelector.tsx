/**
 * @file PageSelector.tsx
 * @description Premium multi-page navigation selector with smooth interactions and micro-animations.
 */

import { Plus, X } from "lucide-react";
import type { Page } from "@/lib/studio/types";

export function PageSelector({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
}: {
  pages: Page[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {pages
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((page) => {
            const isActive = page.id === activePageId;
            // Việt hóa tiêu đề hiển thị từ "Page X" sang "Trang X"
            const displayTitle = page.title.startsWith("Page ") 
              ? page.title.replace("Page ", "Trang ") 
              : page.title;

            return (
              <div
                key={page.id}
                className={`group relative flex items-center h-9 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-100 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
                onClick={() => onSelectPage(page.id)}
              >
                <span className="px-3.5 pr-8 select-none">{displayTitle}</span>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page.id);
                    }}
                    className="absolute right-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-all duration-150"
                    title={`Xóa ${displayTitle}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
      </div>

      <button
        type="button"
        onClick={onAddPage}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-dashed border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 bg-zinc-900/10 text-zinc-500 hover:text-violet-300 transition-all duration-200"
        title="Thêm trang mới"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
