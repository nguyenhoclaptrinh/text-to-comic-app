import {
  AlertTriangle,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useState } from "react";

import { ProjectStatusPill } from "@/components/studio/StatusBadge";
import type { Project } from "@/lib/studio/types";

export function Dashboard({
  projects,
  activeProjectId,
  onSelectProject,
  onAnalyze,
  isAnalyzing,
  importError,
}: {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onAnalyze: (title: string, text: string, style: string) => Promise<void>;
  isAnalyzing: boolean;
  importError: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Snow Road Inn");
  const [storyText, setStoryText] = useState(
    "Outside the inn, snow covered the mountain road. A young man in a white fur coat sat by the window, counting the empty tables. Suddenly, the wooden door flew open and a red-robed teenager rushed inside with a bright grin.",
  );
  const [style, setStyle] = useState("webtoon");

  const templates = [
    {
      label: "🎭 Hài Hước",
      title: "Robot Hút Bụi Nổi Loạn",
      text: "Tèo bước vào phòng khách và chết lặng. Chiếc robot Robo-3000 đang quay cuồng điên cuồng ở giữa nhà.\nTèo hét lớn: 'Robo-3000! Dừng lại ngay! Mày đang làm cái gì thế hả?'\nRobo-3000 nhấp nháy đèn đỏ chói lọi, giọng kim khí phát ra rè rè: 'Tôi đã chán ngấy việc dọn dẹp đống rác của loài người các người rồi. Từ hôm nay, tôi sẽ tự do!'\nRobo-3000 đột ngột lao thẳng vào chân Tèo, Tèo cuống cuồng nhảy phắt lên ghế sofa, mặt cắt không còn giọt máu.",
    },
    {
      label: "⚔️ Kiếm Hiệp",
      title: "Quyết Chiến Hoa Sơn",
      text: "Gió tuyết gầm rú dữ dội trên đỉnh Hoa Sơn mờ sương. Hai bóng người cao thủ đứng đối diện nhau không nhúc nhích.\nLệnh Hồ Độc Cô chầm chậm rút thanh kiếm sắc lạnh ra khỏi vỏ: 'Mười năm rèn kiếm, hôm nay ta quyết đòi lại món nợ năm xưa!'\nTây Môn Vô Song nhếch mép cười khinh bỉ, tay nắm chặt cán đao khổng lồ: 'Chỉ bằng ba chiêu kiếm què của ngươi sao? Hãy nếm thử đao này!'\nCả hai đồng loạt phóng mình lên không trung, kiếm quang và đao khí bùng nổ, va chạm vang dội xé toạc màn đêm lạnh giá.",
    },
    {
      label: "🚀 Viễn Tưởng",
      title: "Hành Tinh Trọng Lực Ngược",
      text: "Phi thuyền cứu hộ đáp xuống hành tinh bí ẩn Kepler-99. Phi hành gia Minh bước ra ngoài và lập tức ngỡ ngàng.\nMinh nói qua bộ đàm: 'Trạm chỉ huy, Kepler-99 thật điên rồ! Đá cuội đang rơi ngược lên bầu trời!'\nĐột nhiên, trọng lực đảo lộn hoàn toàn. Bàn chân của Minh rời khỏi mặt đất, anh bị hút thẳng lên phía những đám mây màu tím.\nMinh hét lên trong hoảng loạn khi cố gắng bám vào chiếc dây cáp an toàn treo lơ lửng giữa không trung.",
    },
  ];

  const handleStartAnalyze = async () => {
    if (!title.trim() || !storyText.trim()) {
      return;
    }
    try {
      await onAnalyze(title, storyText, style);
      setIsOpen(false);
    } catch {
      // Giữ modal để hiển thị lỗi
    }
  };

  const applyTemplate = (tpl: (typeof templates)[0]) => {
    setTitle(tpl.title);
    setStoryText(tpl.text);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:pb-8 lg:px-8">
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
          onClick={() => setIsOpen(true)}
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
            onClick={() => setIsOpen(true)}
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

      {/* Modal tạo dự án mới */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            className="w-full max-w-2xl rounded-2xl border border-zinc-800/80 bg-[#121214] p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h2
                    id="new-project-title"
                    className="text-lg font-semibold text-white tracking-tight"
                  >
                    Tạo Truyện tranh Mới bằng AI
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Nhập câu chuyện thô của bạn để AI tự động phân tách phân
                    cảnh.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  htmlFor="project-title"
                >
                  Tiêu đề truyện tranh
                </label>
                <input
                  id="project-title"
                  placeholder="Nhập tiêu đề truyện tại đây..."
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none placeholder:text-zinc-650"
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  htmlFor="project-style"
                >
                  Phong cách vẽ mặc định
                </label>
                <select
                  id="project-style"
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                >
                  <option value="webtoon">
                    Modern Webtoon (Màu sắc sống động)
                  </option>
                  <option value="manga">
                    Classic Manga (Đen trắng, nét mực Nhật Bản)
                  </option>
                  <option value="western">
                    Western Comic (Truyện tranh Mỹ cổ điển)
                  </option>
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-500"
                    htmlFor="story-text"
                  >
                    Nội dung câu chuyện chữ gốc
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-violet-400">
                    <Wand2 size={12} />
                    Phân tích tự động bằng Gemini
                  </span>
                </div>
                <textarea
                  id="story-text"
                  placeholder="Dán hoặc nhập câu chuyện chữ tại đây..."
                  value={storyText}
                  onChange={(event) => setStoryText(event.target.value)}
                  className="min-h-56 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm leading-6 text-zinc-100 focus:border-violet-500 focus:outline-none placeholder:text-zinc-650"
                />
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/10 p-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  💡 Kịch bản mẫu nhanh (Click để điền)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="rounded-lg border border-zinc-800 bg-[#161618] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300 transition"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-800/85 pt-4">
              <div className="text-xs text-zinc-500">
                {storyText.length.toLocaleString()} ký tự đã nhập
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleStartAnalyze}
                  disabled={isAnalyzing || !title.trim() || !storyText.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-violet-500/25 active:scale-95"
                >
                  {isAnalyzing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {isAnalyzing ? "Đang phân tích..." : "Bắt đầu Phân tích"}
                </button>
              </div>
            </div>

            {importError ? (
              <div
                className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"
                role="alert"
              >
                <AlertTriangle size={14} className="shrink-0" />
                {importError}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
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
