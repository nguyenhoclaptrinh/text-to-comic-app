/**
 * @file ExportModalParts.tsx
 * @description Small presentational parts used by the export modal.
 */

import { AlertTriangle, Download, Play } from "lucide-react";

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
          {count} panel needs image generation.
        </div>
        <button
          type="button"
          onClick={onGoToStoryboard}
          className="mt-2 inline-flex h-8 items-center gap-2 rounded-lg border border-amber-300/30 px-3 text-xs font-semibold hover:bg-amber-500/10"
        >
          <Play size={13} />
          Return to storyboard
        </button>
      </div>
    </div>
  );
}

export function ExportProgress({ progress }: { progress: number }) {
  return (
    <div className="mt-5" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
        <span>Rendering export canvas</span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ExportActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="h-10 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:bg-zinc-900"
      >
        Cancel
      </button>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400"
      >
        <Download size={16} />
        Export PNG
      </button>
    </div>
  );
}
