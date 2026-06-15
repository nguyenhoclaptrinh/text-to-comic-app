import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Laugh,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Swords,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { ProjectStatusPill } from "@/components/studio/StatusBadge";
import type { Project } from "@/lib/studio/types";

export function Dashboard({
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onAnalyze,
  isAnalyzing,
  importError,
}: {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAnalyze: (
    title: string,
    text: string,
    style: string,
    genre?: string,
    aspectRatio?: string,
    outputLanguage?: "en" | "vi",
  ) => Promise<void>;
  isAnalyzing: boolean;
  importError: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Snow Road Inn");
  const [storyText, setStoryText] = useState(
    "Outside the inn, snow covered the mountain road. A young man in a white fur coat sat by the window, counting the empty tables. Suddenly, the wooden door flew open and a red-robed teenager rushed inside with a bright grin.",
  );
  const [style, setStyle] = useState("webtoon");
  const [genre, setGenre] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const templates = [
    {
      label: "Hài Hước",
      icon: Laugh,
      title: "Robot Hút Bụi Nổi Loạn",
      text: "Tèo bước vào phòng khách và chết lặng. Chiếc robot Robo-3000 đang quay cuồng điên cuồng ở giữa nhà.\nTèo hét lớn: 'Robo-3000! Dừng lại ngay! Mày đang làm cái gì thế hả?'\nRobo-3000 nhấp nháy đèn đỏ chói lọi, giọng kim khí phát ra rè rè: 'Tôi đã chán ngấy việc dọn dẹp đống rác của loài người các người rồi. Từ hôm nay, tôi sẽ tự do!'\nRobo-3000 đột ngột lao thẳng vào chân Tèo, Tèo cuống cuồng nhảy phắt lên ghế sofa, mặt cắt không còn giọt máu.",
    },
    {
      label: "Kiếm Hiệp",
      icon: Swords,
      title: "Quyết Chiến Hoa Sơn",
      text: "Gió tuyết gầm rú dữ dội trên đỉnh Hoa Sơn mờ sương. Hai bóng người cao thủ đứng đối diện nhau không nhúc nhích.\nLệnh Hồ Độc Cô chầm chậm rút thanh kiếm sắc lạnh ra khỏi vỏ: 'Mười năm rèn kiếm, hôm nay ta quyết đòi lại món nợ năm xưa!'\nTây Môn Vô Song nhếch mép cười khinh bỉ, tay nắm chặt cán đao khổng lồ: 'Chỉ bằng ba chiêu kiếm què của ngươi sao? Hãy nếm thử đao này!'\nCả hai đồng loạt phóng mình lên không trung, kiếm quang và đao khí bùng nổ, va chạm vang dội xé toạc màn đêm lạnh giá.",
    },
    {
      label: "Viễn Tưởng",
      icon: Rocket,
      title: "Hành Tinh Trọng Lực Ngược",
      text: "Phi thuyền cứu hộ đáp xuống hành tinh bí ẩn Kepler-99. Phi hành gia Minh bước ra ngoài và lập tức ngỡ ngàng.\nMinh nói qua bộ đàm: 'Trạm chỉ huy, Kepler-99 thật điên rồ! Đá cuội đang rơi ngược lên bầu trời!'\nĐột nhiên, trọng lực đảo lộn hoàn toàn. Bàn chân của Minh rời khỏi mặt đất, anh bị hút thẳng lên phía những đám mây màu tím.\nMinh hét lên trong hoảng loạn khi cố gắng bám vào chiếc dây cáp an toàn treo lơ lửng giữa không trung.",
    },
  ];

  const handleStartAnalyze = async () => {
    if (!title.trim() || !storyText.trim()) {
      return;
    }
    try {
      await onAnalyze(title, storyText, style, genre, aspectRatio, "vi");
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
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 transition-colors duration-200 md:pb-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Dự án của tôi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Tiếp tục bản nháp, xử lý khung cần vẽ lại hoặc bắt đầu một truyện
            mới từ văn bản.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 shadow-lg shadow-primary/10"
        >
          <Plus size={16} />
          Tạo dự án mới
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-surface p-8 text-center shadow-inner">
          <div className="relative mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
            <Plus size={36} className="animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Hành trình sáng tạo bắt đầu từ đây!
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
            Biến câu chuyện chữ của bạn thành những trang truyện tranh/webtoon
            sống động với quy trình AI có thể chỉnh sửa từng bước.
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-95"
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
              onDelete={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa dự án "${project.title}" không?`)) {
                  onDeleteProject(project.id);
                }
              }}
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
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-main/80 bg-surface-elevated p-6 text-text-primary shadow-2xl transition-all"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h2
                    id="new-project-title"
                    className="text-lg font-semibold text-text-primary tracking-tight"
                  >
                    Tạo Truyện tranh bằng AI
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Nhập câu chuyện để app tách thành storyboard có thể chỉnh
                    sửa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng hộp thoại tạo dự án"
                className="flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                  htmlFor="project-title"
                >
                  Tiêu đề truyện tranh
                </label>
                <input
                  id="project-title"
                  placeholder="Nhập tiêu đề truyện tại đây..."
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-11 w-full rounded-lg border border-border-main bg-background/40 px-3.5 text-sm text-text-primary focus:border-primary focus:outline-none placeholder:text-text-secondary/50"
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                  htmlFor="project-style"
                >
                  Phong cách vẽ
                </label>
                <select
                  id="project-style"
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  className="h-11 w-full rounded-lg border border-border-main bg-background/40 px-3.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                >
                  <option
                    value="webtoon"
                    className="bg-surface text-text-primary"
                  >
                    Modern Webtoon (Màu sắc sống động)
                  </option>
                  <option
                    value="manga"
                    className="bg-surface text-text-primary"
                  >
                    Classic Manga (Đen trắng, nét mực Nhật Bản)
                  </option>
                  <option
                    value="western"
                    className="bg-surface text-text-primary"
                  >
                    Western Comic (Truyện tranh Mỹ cổ điển)
                  </option>
                </select>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                  htmlFor="project-genre"
                >
                  Thể loại truyện
                </label>
                <select
                  id="project-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border-main bg-background/40 px-3.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="">Chọn thể loại</option>
                  <option value="Ngôn tình">Ngôn tình</option>
                  <option value="Kinh dị">Kinh dị</option>
                  <option value="Xuyên không">Xuyên không</option>
                  <option value="Trọng sinh">Trọng sinh</option>
                  <option value="Học đường">Học đường</option>
                  <option value="Hành động">Hành động</option>
                  <option value="Trinh thám">Trinh thám</option>
                  <option value="Ma thuật">Ma thuật</option>
                  <option value="Hài hước">Hài hước</option>
                </select>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                  htmlFor="project-aspect"
                >
                  Tỉ lệ khung hình
                </label>
                <select
                  id="project-aspect"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border-main bg-background/40 px-3.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="1:1">1:1</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                    htmlFor="story-text"
                  >
                    Nội dung câu chuyện chữ gốc
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                    <Wand2 size={12} />
                    Tự động tách storyboard
                  </span>
                </div>
                <textarea
                  id="story-text"
                  placeholder="Dán hoặc nhập câu chuyện chữ tại đây..."
                  value={storyText}
                  onChange={(event) => setStoryText(event.target.value)}
                  className="min-h-56 w-full resize-y rounded-lg border border-border-main bg-background/40 p-3 text-sm leading-6 text-text-primary focus:border-primary focus:outline-none placeholder:text-text-secondary/50"
                />
              </div>

              <div className="rounded-xl border border-border-main/80 bg-background/10 p-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Kịch bản mẫu nhanh
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((tpl) => (
                    <TemplateButton
                      key={tpl.label}
                      template={tpl}
                      onClick={() => applyTemplate(tpl)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-xs leading-5 text-text-secondary">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-success"
                  size={14}
                />
                <span>
                  Không có API key thì demo vẫn tạo storyboard và ảnh fallback
                  có kiểm soát, nên phần đã nhập không bị mất khi AI offline.
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border-main/85 pt-4">
              <div className="text-xs text-text-secondary">
                {storyText.length.toLocaleString()} ký tự đã nhập
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-border-main bg-transparent px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface hover:text-text-primary transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleStartAnalyze}
                  disabled={isAnalyzing || !title.trim() || !storyText.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-primary/25 active:scale-95"
                >
                  {isAnalyzing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {isAnalyzing ? "Đang phân tích..." : "Tạo storyboard"}
                </button>
              </div>
            </div>

            {importError ? (
              <div
                className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-650 dark:text-red-200"
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

function TemplateButton({
  template,
  onClick,
}: {
  template: { label: string; icon: LucideIcon };
  onClick: () => void;
}) {
  const Icon = template.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border-main bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
    >
      <Icon size={13} />
      {template.label}
    </button>
  );
}

function ProjectCard({
  project,
  selected,
  onSelect,
  onDelete,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`relative group min-h-56 rounded-xl border bg-surface p-4 text-left transition ${
        selected
          ? "border-primary/60 shadow-lg shadow-primary/5"
          : "border-border-main"
      }`}
    >
      {/* Delete button absolutely positioned at the top-right of the card */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Xóa dự án ${project.title}`}
        className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500 hover:bg-red-500/20 hover:text-red-300 transition shadow-sm backdrop-blur-sm cursor-pointer"
      >
        <Trash2 size={14} />
      </button>

      <div onClick={onSelect} className="cursor-pointer">
        <div
          className="mb-4 grid h-28 grid-cols-3 gap-2 rounded-lg bg-background p-3"
          aria-hidden="true"
        >
          <div className="rounded-md bg-slate-800/80 dark:bg-slate-800" />
          <div className="rounded-md bg-zinc-400/80 dark:bg-zinc-700" />
          <div className="rounded-md bg-stone-400/80 dark:bg-stone-700" />
        </div>
        <div className="flex items-center justify-between gap-3 pr-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
            {project.title}
          </h2>
          <ProjectStatusPill status={project.status} />
        </div>
        <div className="mt-3 text-sm text-text-secondary">
          {project.panelCount} khung hình · Cập nhật {project.updatedAt}
        </div>
      </div>
    </div>
  );
}
