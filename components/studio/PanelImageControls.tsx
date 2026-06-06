/**
 * @file PanelImageControls.tsx
 * @description Image preview and generation controls for a storyboard panel.
 */

import { Image as ImageIcon, Loader2, RotateCw } from "lucide-react";

import { PanelPreview } from "@/components/studio/PanelArtwork";
import { STATUS_COPY } from "@/lib/studio/constants";
import type { Panel } from "@/lib/studio/types";

export function PanelImageControls({
  panel,
  disabled,
  onGenerate,
  onUpdate,
}: {
  panel: Panel;
  disabled: boolean;
  onGenerate: () => void;
  onUpdate: (patch: Partial<Panel>) => void;
}) {
  return (
    <div className="flex min-h-72 flex-col border-t border-zinc-800 bg-zinc-950 p-4 lg:border-l lg:border-t-0">
      <PanelPreview panel={panel} />
      <div className="mt-3">
        <label
          htmlFor={`panel-style-${panel.id}`}
          className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
        >
          Phong cách vẽ của Panel
        </label>
        <select
          id={`panel-style-${panel.id}`}
          value={panel.style || "inherit"}
          onChange={(e) =>
            onUpdate({
              style: e.target.value as
                | "inherit"
                | "manga"
                | "webtoon"
                | "western",
            })
          }
          className="mt-1 h-8 w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
        >
          <option value="inherit">Kế thừa phong cách truyện</option>
          <option value="webtoon">Modern Webtoon (Màu)</option>
          <option value="manga">Classic Manga (Đen trắng)</option>
          <option value="western">Western Comic (Mỹ cổ điển)</option>
        </select>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <PanelImageMessage panel={panel} />
        <GenerateButton
          panel={panel}
          disabled={disabled}
          onGenerate={onGenerate}
        />
      </div>
    </div>
  );
}

function GenerateButton({
  panel,
  disabled,
  onGenerate,
}: {
  panel: Panel;
  disabled: boolean;
  onGenerate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={disabled || panel.status === "generating"}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GenerateIcon status={panel.status} />
      {panel.status === "success" ? "Regenerate" : "Generate"}
    </button>
  );
}

function GenerateIcon({ status }: { status: Panel["status"] }) {
  if (status === "generating") {
    return <Loader2 className="animate-spin" size={15} />;
  }

  if (status === "success") {
    return <RotateCw size={15} />;
  }

  return <ImageIcon size={15} />;
}

function PanelImageMessage({ panel }: { panel: Panel }) {
  if (panel.errorMessage) {
    return (
      <div className="min-w-0 text-xs text-red-200">{panel.errorMessage}</div>
    );
  }

  return (
    <div className="text-xs text-zinc-500">
      Image state: {STATUS_COPY[panel.status]}
    </div>
  );
}
