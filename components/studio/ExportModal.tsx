/**
 * @file ExportModal.tsx
 * @description Export dialog for multi-page PNG, PDF, and ZIP workflow.
 */

import { CheckCircle2, ImageOff, X } from "lucide-react";
import { useState } from "react";

import {
  ExportActions,
  ExportProgress,
  MissingImagesWarning,
} from "@/components/studio/ExportModalParts";
import { exportComicPng } from "@/lib/studio/export-renderer";
import type { Panel } from "@/lib/studio/types";

type ExportStatus = "idle" | "rendering" | "done" | "error";

export function ExportModal({
  panels,
  projectTitle,
  missingImages,
  onClose,
  onGoToStoryboard,
}: {
  panels: Panel[];
  projectTitle: string;
  missingImages: number;
  onClose: () => void;
  onGoToStoryboard: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const canExport = panels.some((panel) => panel.status === "success");
  const generatedCount = panels.filter(
    (panel) => panel.status === "success",
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="w-full max-w-xl rounded-xl border border-border-main bg-surface-elevated p-6 text-text-primary shadow-2xl transition-all duration-300"
      >
        <ExportModalHeader onClose={onClose} />

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border-main bg-background/30 p-3">
            <div className="text-sm font-semibold text-text-primary">
              {generatedCount}/{panels.length} khung đã có ảnh
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Export PNG sẽ dùng các khung đã vẽ hoặc ảnh fallback có sẵn.
            </p>
          </div>
          <div className="rounded-lg border border-border-main bg-background/30 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              {missingImages > 0 ? (
                <ImageOff size={15} />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {missingImages > 0
                ? `${missingImages} khung còn thiếu ảnh`
                : "Sẵn sàng xuất file"}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Bạn có thể quay lại vẽ tiếp hoặc xuất phần đã có cho demo.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full cursor-default items-center gap-3 rounded-lg border border-primary/50 bg-primary/10 p-3.5 text-left shadow-[0_0_12px_rgba(139,92,246,0.1)] transition-all duration-200"
            aria-pressed="true"
          >
            <CheckCircle2 className="text-primary" size={20} />
            <div>
              <div className="text-sm font-semibold text-text-primary">
                Ảnh dọc Webtoon PNG
              </div>
              <div className="mt-0.5 text-xs text-text-secondary">
                Ghép nối tất cả khung hình thành một dải cuộn liên tục độ phân
                giải cao.
              </div>
            </div>
          </button>

          {missingImages > 0 ? (
            <MissingImagesWarning
              count={missingImages}
              onGoToStoryboard={onGoToStoryboard}
            />
          ) : null}
        </div>

        {status === "rendering" && <ExportProgress progress={progress} />}

        <ExportActions
          status={status}
          canExport={canExport}
          onClose={onClose}
          onExportPng={handleExport}
          exportLabel={missingImages > 0 ? "Xuất phần đã có" : "Tải file"}
        />
      </section>
    </div>
  );

  async function handleExport() {
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
    } catch {
      setProgress(0);
      setStatus("error");
    }
  }
}

function ExportModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 id="export-title" className="text-xl font-semibold tracking-tight">
          Xuất truyện
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Tải bản truyện đã vẽ thành file để nộp, trình chiếu hoặc chia sẻ.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng hộp thoại xuất"
        className="flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
