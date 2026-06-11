/**
 * @file PanelImageControls.tsx
 * @description Image preview and generation controls for a storyboard panel.
 */

import {
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  RotateCw,
} from "lucide-react";
import { useState } from "react";

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="flex min-h-72 flex-col border-t border-zinc-800 bg-zinc-950 p-4 lg:border-l lg:border-t-0">
      <PanelPreview panel={panel} />
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex h-9 w-full items-center justify-between px-3 text-xs font-semibold text-zinc-300"
        >
          Tùy chọn nâng cao
          <ChevronDown
            size={14}
            className={`transition ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>
        {advancedOpen ? (
          <div className="border-t border-zinc-800 p-3">
            <label
              htmlFor={`panel-style-${panel.id}`}
              className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
            >
              Phong cách vẽ
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
              <option value="inherit">Theo phong cách của truyện</option>
              <option value="webtoon">Webtoon màu</option>
              <option value="manga">Manga đen trắng</option>
              <option value="western">Comic Mỹ cổ điển</option>
            </select>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <PanelImageMessage
          panel={panel}
          disabled={disabled}
          onGenerate={onGenerate}
        />
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
      disabled={
        disabled || panel.status === "generating" || panel.status === "queued"
      }
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GenerateIcon status={panel.status} />
      {panel.status === "queued" || panel.status === "generating"
        ? "Đang vẽ"
        : panel.status === "success"
          ? "Vẽ lại"
          : "Vẽ ảnh"}
    </button>
  );
}

function GenerateIcon({ status }: { status: Panel["status"] }) {
  if (status === "generating") {
    return <Loader2 className="animate-spin" size={15} />;
  }

  if (status === "queued") {
    return <Loader2 className="animate-spin" size={15} />;
  }

  if (status === "success") {
    return <RotateCw size={15} />;
  }

  return <ImageIcon size={15} />;
}

function PanelImageMessage({
  panel,
  disabled,
  onGenerate,
}: {
  panel: Panel;
  disabled: boolean;
  onGenerate: () => void;
}) {
  if (panel.status === "error" || panel.errorMessage) {
    return (
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="min-w-0 text-xs text-red-300 font-medium break-words leading-tight">
          {panel.errorMessage || "Chưa vẽ được ảnh. Bạn có thể thử lại."}
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled || panel.status === "generating"}
          className="inline-flex h-7 items-center justify-center gap-1 rounded bg-red-500/10 border border-red-500/30 px-2.5 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        >
          <RotateCw
            size={11}
            className={panel.status === "generating" ? "animate-spin" : ""}
          />
          Thử vẽ lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 text-xs text-zinc-500">
      <div>Trạng thái ảnh: {STATUS_COPY[panel.status]}</div>
      {panel.usedProvider || panel.usedModel ? (
        <div className="mt-1 truncate text-[11px] text-zinc-600">
          {formatAiRoute(panel)}
        </div>
      ) : null}
    </div>
  );
}

function formatAiRoute(panel: Panel) {
  const provider = panel.usedProvider
    ? panel.usedProvider === "kaggle"
      ? "Kaggle"
      : panel.usedProvider
    : "AI";
  return panel.usedModel ? `${provider} · ${panel.usedModel}` : provider;
}
