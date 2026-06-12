/**
 * @file ExportModalParts.tsx
 * @description Small presentational parts used by the export modal.
 */

import { AlertTriangle, Download, Loader2, Play } from "lucide-react";

export function MissingImagesWarning({
  count,
  onGoToStoryboard,
}: {
  count: number;
  onGoToStoryboard: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-text-primary"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={18} />
      <div>
        <div className="font-semibold">Có {count} khung chưa có ảnh.</div>
        <button
          type="button"
          onClick={onGoToStoryboard}
          className="mt-2 inline-flex h-8 items-center gap-2 rounded-lg border border-warning/40 px-3 text-xs font-semibold transition-colors hover:bg-warning/10"
        >
          <Play size={13} />
          Quay lại vẽ ảnh
        </button>
      </div>
    </div>
  );
}

export function ExportProgress({ progress }: { progress: number }) {
  return (
    <div className="mt-5" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
        <span>Đang ghép ảnh và lời thoại...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ExportActions({
  status,
  canExport,
  onClose,
  onExportPng,
  exportLabel = "Tải file",
}: {
  status: "idle" | "rendering" | "done" | "error";
  canExport: boolean;
  onClose: () => void;
  onExportPng: () => void;
  exportLabel?: string;
}) {
  const isRendering = status === "rendering";

  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="h-10 rounded-lg border border-border-main px-4 text-sm text-text-secondary transition-colors hover:bg-surface"
      >
        Đóng
      </button>
      <button
        type="button"
        onClick={onExportPng}
        disabled={!canExport || isRendering}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRendering ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Download size={16} />
        )}
        {status === "done"
          ? "Đã xuất xong"
          : status === "rendering"
            ? "Đang xuất..."
            : exportLabel}
      </button>
    </div>
  );
}
