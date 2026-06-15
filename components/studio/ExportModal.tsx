/**
 * @file ExportModal.tsx
 * @description Export preview overlay showing successfully generated AI images, bubble text overlay, and export/save controls.
 */

import { Download, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";

import { ComicPanelArt } from "@/components/studio/PanelArtwork";
import { type DisplayLanguage, getPanelScenePromptDisplay } from "@/lib/studio/display";
import { exportComicPng } from "@/lib/studio/export-renderer";
import type { Panel } from "@/lib/studio/types";

type ExportStatus = "idle" | "rendering" | "done" | "error";

export function ExportModal({
  panels,
  projectTitle,
  missingImages,
  onClose,
  onGoToStoryboard,
  outputLanguage = "en",
}: {
  panels: Panel[];
  projectTitle: string;
  missingImages: number;
  onClose: () => void;
  onGoToStoryboard: () => void;
  outputLanguage?: DisplayLanguage;
}) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportStatus>("idle");

  const generatedPanels = panels
    .filter((panel) => panel.status === "success")
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const generatedCount = generatedPanels.length;

  async function handleExport() {
    if (generatedCount === 0) return;
    setStatus("rendering");
    setProgress(20);

    try {
      await waitForPaint();
      setProgress(50);

      await exportComicPng({
        projectTitle,
        panels,
        includeMissingPanels: false,
      });

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
            <p className="text-sm font-medium text-zinc-200">Đang chuẩn bị file truyện...</p>
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
            <h2 id="preview-title" className="text-base font-semibold text-white">
              Tổng cộng: <span className="text-violet-400">{generatedCount}</span> hình
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={generatedCount === 0 || status === "rendering"}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "done" ? (
                "Đã xuất xong"
              ) : (
                <>
                  <Download size={14} />
                  Lưu file
                </>
              )}
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
              <h3 className="text-base font-semibold text-zinc-200">Chưa có hình ảnh nào được gen</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Hãy quay lại Storyboard hoặc Workspace để thực hiện Vẽ ảnh AI trước khi xuất file.
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
                    <span className="font-medium">Khung {panel.orderIndex}</span>
                    <span className="italic text-[10px] text-zinc-500 truncate max-w-[200px] md:max-w-[350px]" title={getPanelScenePromptDisplay(panel, outputLanguage)}>
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
