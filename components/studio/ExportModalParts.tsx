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
      className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={18} />
      <div>
        <div className="font-semibold">
          Có {count} khung hình chưa được vẽ ảnh.
        </div>
        <button
          type="button"
          onClick={onGoToStoryboard}
          className="mt-2 inline-flex h-8 items-center gap-2 rounded-lg border border-amber-300/30 px-3 text-xs font-semibold hover:bg-amber-500/10 transition-colors"
        >
          <Play size={13} />
          Quay lại Storyboard để vẽ ảnh
        </button>
      </div>
    </div>
  );
}

export function ExportProgress({ progress }: { progress: number }) {
  return (
    <div className="mt-5" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
        <span>Đang ghép nối và kết xuất hình ảnh...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
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
}: {
  status: "idle" | "rendering" | "done" | "error";
  canExport: boolean;
  onClose: () => void;
  onExportPng: () => void;
}) {
  const isRendering = status === "rendering";

  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="h-10 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors"
      >
        Hủy bỏ
      </button>
      <button
        type="button"
        onClick={onExportPng}
        disabled={!canExport || isRendering}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-md shadow-violet-500/15"
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
            : "Xuất bản & Tải về"}
      </button>
    </div>
  );
}
