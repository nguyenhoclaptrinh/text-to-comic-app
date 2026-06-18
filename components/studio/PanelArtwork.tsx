/**
 * @file PanelArtwork.tsx
 * @description Shared generated-image placeholders for storyboard and comic previews.
 */

import { AlertTriangle, Image as ImageIcon, Loader2 } from "lucide-react";

import { STATUS_COPY } from "@/lib/studio/constants";
import type { Panel } from "@/lib/studio/types";

export function PanelPreview({
  panel,
  compact,
}: {
  panel: Panel;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-border-main bg-gradient-to-br ${panel.imageTone} ${
        compact ? "min-h-40" : "min-h-52"
      }`}
      aria-label={`Trạng thái ảnh khung ${panel.orderIndex}: ${STATUS_COPY[panel.status]}`}
    >
      <PanelPreviewContent panel={panel} />
    </div>
  );
}

export function ComicPanelArt({ panel }: { panel: Panel }) {
  if (panel.imageUrl) {
    return (
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        role="img"
        aria-label={`Ảnh đã vẽ cho khung ${panel.orderIndex}`}
        style={{ backgroundImage: `url("${panel.imageUrl}")` }}
      />
    );
  }

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute left-[9%] top-[14%] h-[62%] w-[28%] rounded-full bg-white/10 blur-sm" />
      <div className="absolute bottom-[18%] right-[12%] h-[42%] w-[24%] rounded-full bg-amber-300/10 blur-sm" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/35" />
      <div className="absolute bottom-8 left-[14%] h-24 w-16 rounded-t-full bg-zinc-200/20" />
      <div className="absolute bottom-8 right-[18%] h-28 w-20 rounded-t-full bg-red-300/20" />
      <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
        Khung {panel.orderIndex}
      </div>
    </div>
  );
}

function PanelPreviewContent({ panel }: { panel: Panel }) {
  if (panel.status === "generating") {
    return (
      <div
        className="flex flex-col items-center gap-3 text-violet-100"
        role="status"
      >
        <Loader2 className="animate-spin" size={34} />
        <div className="text-sm">Đang vẽ khung truyện...</div>
      </div>
    );
  }

  if (panel.status === "queued") {
    return (
      <div
        className="flex flex-col items-center gap-3 text-sky-100"
        role="status"
      >
        <Loader2 className="animate-spin" size={34} />
        <div className="text-sm">Đang chờ đến lượt vẽ...</div>
      </div>
    );
  }

  if (panel.status === "error") {
    return (
      <div
        className="flex flex-col items-center gap-3 text-red-100"
        role="alert"
      >
        <AlertTriangle size={34} />
        <div className="text-sm">Chưa vẽ được ảnh</div>
      </div>
    );
  }

  if (panel.status === "draft") {
    return (
      <div className="flex flex-col items-center gap-3 text-zinc-300">
        <ImageIcon size={34} />
        <div className="text-sm">Chưa có ảnh</div>
      </div>
    );
  }

  return <ComicPanelArt panel={panel} />;
}
