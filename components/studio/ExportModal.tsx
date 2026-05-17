/**
 * @file ExportModal.tsx
 * @description Export dialog for PNG/PDF export workflow.
 */

import { CheckCircle2, FileText, X } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#18181b] p-5 shadow-2xl"
      >
        <ExportModalHeader onClose={onClose} />
        <ExportOptions
          missingImages={missingImages}
          onGoToStoryboard={onGoToStoryboard}
        />
        <ExportProgress progress={progress} />
        <ExportActions
          status={status}
          canExport={canExport}
          onClose={onClose}
          onExportPng={handleExportPng}
        />
      </section>
    </div>
  );

  async function handleExportPng() {
    setStatus("rendering");
    setProgress(35);

    try {
      await waitForPaint();
      setProgress(78);
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
        <h2 id="export-title" className="text-xl font-semibold">
          Export Comic
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          PNG vertical is the MVP export format.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close export modal"
        className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ExportOptions({
  missingImages,
  onGoToStoryboard,
}: {
  missingImages: number;
  onGoToStoryboard: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
        <CheckCircle2 className="text-emerald-300" size={20} />
        <div>
          <div className="text-sm font-semibold text-white">PNG vertical</div>
          <div className="text-xs text-emerald-100/80">
            Includes generated panels and bubbles.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 opacity-70">
        <FileText className="text-zinc-400" size={20} />
        <div>
          <div className="text-sm font-semibold text-white">PDF</div>
          <div className="text-xs text-zinc-500">Optional backlog item.</div>
        </div>
      </div>
      {missingImages > 0 ? (
        <MissingImagesWarning
          count={missingImages}
          onGoToStoryboard={onGoToStoryboard}
        />
      ) : null}
    </div>
  );
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
