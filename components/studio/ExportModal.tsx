/**
 * @file ExportModal.tsx
 * @description Export preview overlay showing successfully generated AI images, bubble text overlay, and export/save controls.
 */

import { Download, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";

import { ComicPanelArt } from "@/components/studio/PanelArtwork";
import {
  type DisplayLanguage,
  getPanelScenePromptDisplay,
} from "@/lib/studio/display";
import { exportComicPng, exportComicPagesPdf } from "@/lib/studio/export-renderer";
import type { Panel, Page } from "@/lib/studio/types";

type ExportStatus = "idle" | "rendering" | "done" | "error";

export function ExportModal({
  panels,
  pages,
  projectTitle,
  missingImages,
  onClose,
  onGoToStoryboard,
  outputLanguage = "en",
}: {
  panels: Panel[];
  pages: Page[];
  projectTitle: string;
  missingImages: number;
  onClose: () => void;
  onGoToStoryboard: () => void;
  outputLanguage?: DisplayLanguage;
}) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [isImageDropdownOpen, setIsImageDropdownOpen] = useState(false);

  const generatedPanels = panels
    .filter((panel) => panel.status === "success")
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const generatedCount = generatedPanels.length;

  async function triggerExport(mode: "pdf" | "png-combined" | "png-per-page") {
    if (generatedCount === 0) return;
    setIsImageDropdownOpen(false);
    setStatus("rendering");
    setProgress(20);

    try {
      await waitForPaint();
      setProgress(55);

      if (mode === "pdf") {
        await exportComicPagesPdf({
          projectTitle,
          pages,
          includeMissingPanels: false,
        });
      } else if (mode === "png-combined") {
        await exportComicPng({
          projectTitle,
          panels,
          includeMissingPanels: false,
        });
      } else if (mode === "png-per-page") {
        let exportedCount = 0;
        const validPages = pages.filter(
          (page) => page.panels.some((p) => p.status === "success")
        );

        for (const page of validPages) {
          await exportComicPng({
            projectTitle: `${projectTitle} - Trang ${page.orderIndex}`,
            panels: page.panels,
            includeMissingPanels: false,
          });
          exportedCount++;
          setProgress(55 + Math.round((exportedCount / validPages.length) * 40));
        }
      }

      setProgress(100);
      setStatus("done");
      setTimeout(() => {
        setStatus("idle");
      }, 1500);
    } catch {
      setProgress(0);
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 text-text-primary shadow-2xl transition-all duration-305 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Progress overlay when saving */}
        {status === "rendering" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <Loader2 className="animate-spin text-violet-500 mb-4" size={40} />
            <p className="text-sm font-medium text-zinc-200">
              Đang chuẩn bị file truyện...
            </p>
            <div className="w-64 bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 mt-2">{progress}%</span>
          </div>
        )}

        {/* Header bar */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-violet-400" size={20} />
            <h2
              id="preview-title"
              className="text-base font-semibold text-white"
            >
              Tổng cộng:{" "}
              <span className="text-violet-400">{generatedCount}</span> hình
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Dropdown for PNG Export */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsImageDropdownOpen(!isImageDropdownOpen)}
                disabled={generatedCount === 0 || status === "rendering"}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-xs font-semibold text-white transition-all hover:bg-zinc-850 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ImageIcon size={14} />
                Lưu ảnh PNG
              </button>

              {isImageDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsImageDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 z-20 w-44 rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => void triggerExport("png-combined")}
                      className="w-full text-left rounded-md px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                    >
                      Tất cả vào 1 ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => void triggerExport("png-per-page")}
                      className="w-full text-left rounded-md px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                    >
                      Mỗi trang 1 ảnh
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Direct button for PDF Export */}
            <button
              type="button"
              onClick={() => void triggerExport("pdf")}
              disabled={generatedCount === 0 || status === "rendering"}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} />
              Tải PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bản xem trước"
              className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-850 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable preview body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-900/10">
          {generatedCount === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <ImageIcon className="text-zinc-650 mb-4" size={48} />
              <h3 className="text-base font-semibold text-zinc-200">
                Chưa có hình ảnh nào được gen
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Hãy quay lại Storyboard hoặc Workspace để thực hiện Vẽ ảnh AI
                trước khi xuất file.
              </p>
              <button
                type="button"
                onClick={onGoToStoryboard}
                className="mt-6 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
              >
                Quay lại storyboard
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-8">
              {generatedPanels.map((panel) => (
                <article key={panel.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span className="font-medium">
                      Khung {panel.orderIndex}
                    </span>
                    <span
                      className="italic text-[10px] text-zinc-500 truncate max-w-[200px] md:max-w-[350px]"
                      title={getPanelScenePromptDisplay(panel, outputLanguage)}
                    >
                      {getPanelScenePromptDisplay(panel, outputLanguage)}
                    </span>
                  </div>
                  <div
                    className={`relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br ${panel.imageTone} shadow-md`}
                    style={{ aspectRatio: "900 / 520" }}
                  >
                    <ComicPanelArt panel={panel} />

                    {/* Render speech bubbles */}
                    {panel.bubbles.map((bubble) => (
                      <div
                        key={bubble.id}
                        className="comic-text absolute rounded-[24px] rounded-bl-md border-2 border-black bg-white p-3 text-left text-sm font-bold leading-5 text-zinc-950 shadow-lg select-none"
                        style={{
                          left: `${bubble.x}%`,
                          top: `${bubble.y}%`,
                          width: `${bubble.width}%`,
                          minHeight: `${bubble.height}%`,
                        }}
                      >
                        {bubble.text}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
