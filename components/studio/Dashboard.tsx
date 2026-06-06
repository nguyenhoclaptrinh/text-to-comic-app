/**
 * @file Dashboard.tsx
 * @description Project dashboard for selecting existing projects or starting a new one.
 */

import { Plus } from "lucide-react";

import { ProjectStatusPill } from "@/components/studio/StatusBadge";
import type { Project } from "@/lib/studio/types";

export function Dashboard({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
}: {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Dự án của tôi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Tiếp tục bản nháp, vẽ lại các khung hình bị lỗi hoặc bắt đầu tạo một
            truyện tranh mới.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 shadow-lg shadow-violet-500/10"
        >
          <Plus size={16} />
          Tạo dự án mới
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#161619] p-8 text-center shadow-inner">
          <div className="relative mb-6 flex size-20 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 ring-8 ring-violet-500/5">
            <Plus size={36} className="animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200">
            Hành trình sáng tạo bắt đầu từ đây!
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
            Biến câu chuyện chữ của bạn thành những trang truyện tranh/webtoon
            sống động với sức mạnh trí tuệ nhân tạo Gemini.
          </p>
          <button
            type="button"
            onClick={onNewProject}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 shadow-md shadow-violet-500/25 active:scale-95"
          >
            <Plus size={16} />
            Tạo dự án đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              selected={activeProjectId === project.id}
              onSelect={() => onSelectProject(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-56 rounded-xl border bg-[#18181b] p-4 text-left transition hover:border-violet-400/50 ${
        selected
          ? "border-violet-400/60 shadow-lg shadow-violet-500/5"
          : "border-zinc-800"
      }`}
    >
      <div
        className="mb-4 grid h-28 grid-cols-3 gap-2 rounded-lg bg-zinc-950 p-3"
        aria-hidden="true"
      >
        <div className="rounded-md bg-slate-800" />
        <div className="rounded-md bg-zinc-700" />
        <div className="rounded-md bg-stone-700" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-base font-semibold text-white">
          {project.title}
        </h2>
        <ProjectStatusPill status={project.status} />
      </div>
      <div className="mt-3 text-sm text-zinc-400">
        {project.panelCount} khung hình · Cập nhật {project.updatedAt}
      </div>
    </button>
  );
}
