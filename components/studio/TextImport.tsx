/**
 * @file TextImport.tsx
 * @description Story text import form with storyboard JSON preview.
 */

import { useState } from "react";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { StoryboardJsonPreview } from "@/components/studio/StoryboardJsonPreview";

export function TextImport({
  title,
  storyText,
  error,
  isAnalyzing,
  setTitle,
  setStoryText,
  onAnalyze,
}: {
  title: string;
  storyText: string;
  error: string;
  isAnalyzing: boolean;
  setTitle: (value: string) => void;
  setStoryText: (value: string) => void;
  onAnalyze: (style: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:pb-8 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <StoryInputForm
          title={title}
          storyText={storyText}
          error={error}
          isAnalyzing={isAnalyzing}
          setTitle={setTitle}
          setStoryText={setStoryText}
          onAnalyze={onAnalyze}
        />
        <StoryboardJsonPreview />
      </div>
    </div>
  );
}

function StoryInputForm({
  title,
  storyText,
  error,
  isAnalyzing,
  setTitle,
  setStoryText,
  onAnalyze,
}: {
  title: string;
  storyText: string;
  error: string;
  isAnalyzing: boolean;
  setTitle: (value: string) => void;
  setStoryText: (value: string) => void;
  onAnalyze: (style: string) => void;
}) {
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

  const applyTemplate = (tpl: (typeof templates)[0]) => {
    setTitle(tpl.title);
    setStoryText(tpl.text);
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#18181b] p-5 shadow-lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">
              Tạo truyện mới
            </h1>
            <p className="text-sm text-zinc-400">
              Nhập truyện chữ, app sẽ tách thành các khung storyboard để bạn
              chỉnh và vẽ ảnh.
            </p>
          </div>
        </div>
        {title || storyText ? (
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setStoryText("");
            }}
            className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors pt-1"
          >
            Xóa sạch
          </button>
        ) : null}
      </div>

      <div className="mb-4">
        <label
          className="mb-2 block text-sm font-medium text-zinc-300"
          htmlFor="project-title"
        >
          Tiêu đề truyện tranh
        </label>
        <input
          id="project-title"
          placeholder="Nhập tiêu đề truyện tại đây..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="mb-4">
        <label
          className="mb-2 block text-sm font-medium text-zinc-300"
          htmlFor="project-style"
        >
          Phong cách vẽ mặc định
        </label>
        <select
          id="project-style"
          value={style}
          onChange={(event) => setStyle(event.target.value)}
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
        >
          <option value="webtoon">Modern Webtoon (Màu sắc sống động)</option>
          <option value="manga">
            Classic Manga (Đen trắng, nét mực Nhật Bản)
          </option>
          <option value="western">
            Western Comic (Truyện tranh Mỹ cổ điển)
          </option>
        </select>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <label
            className="block text-sm font-medium text-zinc-300"
            htmlFor="story-text"
          >
            Nội dung câu chuyện chữ gốc
          </label>
          <span className="inline-flex items-center gap-1.5 text-xs text-violet-400">
            <Wand2 size={12} />
            Hỗ trợ phân tích bằng AI
          </span>
        </div>
        <textarea
          id="story-text"
          placeholder="Dán hoặc nhập câu chuyện chữ tại đây. Gợi ý: Hãy viết kịch bản chứa các lời thoại nhân vật và miêu tả hành động rõ ràng..."
          value={storyText}
          onChange={(event) => setStoryText(event.target.value)}
          className="min-h-80 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100 focus:border-violet-500 focus:outline-none placeholder:text-zinc-600"
        />
      </div>

      {/* Gợi ý Kịch bản Mẫu nhanh */}
      <div className="mb-5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Gợi ý kịch bản mẫu nhanh
        </span>
        <div className="flex flex-wrap gap-2">
          {templates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300 transition"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-500">
          {storyText.length.toLocaleString()} ký tự đã nhập
        </div>
        <button
          type="button"
          onClick={() => onAnalyze(style)}
          disabled={isAnalyzing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-violet-500/10 active:scale-95"
        >
          {isAnalyzing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {isAnalyzing ? "Đang phân tích..." : "Tạo storyboard"}
        </button>
      </div>

      {error ? (
        <div
          className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 animate-in fade-in slide-in-from-top duration-200"
          role="alert"
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      ) : null}
    </section>
  );
}
