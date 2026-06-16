/**
 * @file StatusBadge.tsx
 * @description Visual status pills for panels and projects.
 */

import { Loader2 } from "lucide-react";

import { STATUS_CLASS, STATUS_COPY } from "@/lib/studio/constants";
import type { PanelStatus, ProjectStatus } from "@/lib/studio/types";

export function StatusBadge({ status }: { status: PanelStatus }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {status === "generating" ? (
        <Loader2 className="mr-1 inline animate-spin" size={12} />
      ) : null}
      {STATUS_COPY[status]}
    </span>
  );
}

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const label: Record<ProjectStatus, string> = {
    draft: "Bản nháp",
    storyboard: "Đang dựng",
    generating: "Đang vẽ",
    done: "Hoàn tất",
    error: "Cần xử lý",
  };

  const className =
    status === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-650 dark:text-red-200"
      : status === "done"
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        : "border-violet-400/30 bg-violet-500/10 text-violet-700 dark:text-violet-200";

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${className}`}
    >
      {label[status]}
    </span>
  );
}
