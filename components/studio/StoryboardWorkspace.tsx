/**
 * @file StoryboardWorkspace.tsx
 * @description Storyboard editing workspace with page selection, character casting and panel cards.
 */

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  FileText,
  MessageCircle,
  Users,
  X,
  Download,
  Wand2,
  Loader2,
} from "lucide-react";

import { CharacterCastingPanel } from "@/components/studio/CharacterCastingPanel";
import { StoryboardPanelCard } from "@/components/studio/StoryboardPanelCard";
import { PageSelector } from "@/components/studio/PageSelector";
import type { GenerationSummary } from "@/lib/studio/types";
import type { Character, Page, Panel } from "@/lib/studio/types";

export function StoryboardWorkspace({
  characters,
  pages,
  activePageId,
  panels,
  selectedPanelId,
  onAddCharacter,
  onDeleteCharacter,
  onUpdateCharacter,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onSelectPanel,
  onUpdatePanel,
  onGeneratePanel,
  onDeletePanel,
  onGoToComic,
  onGoToImport,
  onMovePanel,
  outputLanguage = "en",
  onGenerateAll,
  onOpenExport,
  isGeneratingAll = false,
  projectTitle,
  generationSummary,
  projectStyle,
  projectGenre,
  projectAspectRatio,
}: {
  characters: Character[];
  pages: Page[];
  activePageId: string;
  panels: Panel[];
  selectedPanelId: string;
  onAddCharacter: () => void;
  onDeleteCharacter?: (characterId: string) => void;
  onUpdateCharacter: (characterId: string, patch: Partial<Character>) => void;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onSelectPanel: (panelId: string) => void;
  onUpdatePanel: (panelId: string, patch: Partial<Panel>) => void;
  onGeneratePanel: (panelId: string) => void;
  onDeletePanel: (panelId: string) => void;
  onGoToComic: () => void;
  onGoToImport: () => void;
  onMovePanel: (panelId: string, direction: "up" | "down") => void;
  outputLanguage?: "en" | "vi";
  onGenerateAll?: () => void;
  onOpenExport?: () => void;
  isGeneratingAll?: boolean;
  projectTitle: string;
  generationSummary: GenerationSummary;
  projectStyle?: string;
  projectGenre?: string;
  projectAspectRatio?: string;
}) {
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const hasBackendError = panels.some((panel) => panel.status === "error");

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden transition-colors duration-200 lg:grid-cols-[288px_minmax(0,1fr)]">
      {/* Sidebar Casting nhân vật tĩnh trên màn hình lớn */}
      <CharacterCastingPanel
        characters={characters}
        onAddCharacter={onAddCharacter}
        onUpdateCharacter={onUpdateCharacter}
        onDeleteCharacter={onDeleteCharacter}
        outputLanguage={outputLanguage}
        className="hidden lg:block"
      />

      {/* Vùng biên tập Storyboard bên phải */}
      <section className="min-w-0 overflow-y-auto px-4 py-5 pb-24 md:pb-8 lg:px-6">
        {hasBackendError ? <ImageBackendAlert /> : null}

        <StoryboardHeader
          projectTitle={projectTitle}
          generationSummary={generationSummary}
          onGoToComic={onGoToComic}
          onOpenCasting={() => setIsCastingOpen(true)}
          onGenerateAll={onGenerateAll}
          onOpenExport={onOpenExport}
          isGeneratingAll={isGeneratingAll}
          style={projectStyle}
          genre={projectGenre}
          aspectRatio={projectAspectRatio}
        />

        <PageSelector
          pages={pages}
          activePageId={activePageId}
          onSelectPage={onSelectPage}
          onAddPage={onAddPage}
          onDeletePage={onDeletePage}
        />

        <div className="space-y-4 pb-8">
          {panels.length > 0 ? (
            panels.map((panel, index) => (
              <StoryboardPanelCard
                key={panel.id}
                panel={panel}
                characters={characters}
                outputLanguage={outputLanguage}
                selected={panel.id === selectedPanelId}
                disabled={isGeneratingAll}
                canDelete={panels.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < panels.length - 1}
                onSelect={() => onSelectPanel(panel.id)}
                onUpdate={(patch) => onUpdatePanel(panel.id, patch)}
                onGenerate={() => onGeneratePanel(panel.id)}
                onDelete={() => onDeletePanel(panel.id)}
                onMove={(direction) => onMovePanel(panel.id, direction)}
              />
            ))
          ) : (
            <EmptyStoryboardState onGoToImport={onGoToImport} />
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* RESPONSIVE UI: LEFT SLIDE DRAWER FOR CHARACTER CASTING         */}
      {/* ============================================================== */}

      {/* Slide-out Drawer cho Casting Panel trên di động (< 1024px) */}
      {isCastingOpen && (
        <div className="fixed inset-0 z-40 flex animate-in fade-in bg-black/60 backdrop-blur-sm duration-200 lg:hidden">
          <div
            className="relative flex h-full w-[288px] flex-col border-r border-border-main bg-surface-elevated p-4 shadow-2xl animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Casting nhân vật"
          >
            <div className="mb-4 flex items-center justify-between border-b border-border-main pb-3">
              <span className="inline-flex items-center gap-2 font-semibold text-text-primary">
                <Users size={16} />
                Casting Nhân vật
              </span>
              <button
                type="button"
                onClick={() => setIsCastingOpen(false)}
                aria-label="Đóng bảng nhân vật"
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CharacterCastingPanel
                characters={characters}
                onAddCharacter={onAddCharacter}
                onUpdateCharacter={onUpdateCharacter}
                onDeleteCharacter={onDeleteCharacter}
                outputLanguage={outputLanguage}
                className="border-none bg-transparent p-0"
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsCastingOpen(false)} />
        </div>
      )}
    </div>
  );
}

function EmptyStoryboardState({ onGoToImport }: { onGoToImport: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border-main bg-surface/40 px-5 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <FileText size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary">
        Chưa có storyboard
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        Quay lại Dashboard để tạo dự án từ truyện chữ trước khi vẽ ảnh và xuất
        webtoon.
      </p>
      <button
        type="button"
        onClick={onGoToImport}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <FileText size={16} />
        Về Dashboard
      </button>
    </div>
  );
}

function ImageBackendAlert() {
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-650 dark:text-red-100"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={17} />
      <div>
        <div className="font-semibold">Hệ thống vẽ ảnh cần lưu ý</div>
        <div className="mt-1 text-red-750 dark:text-red-100/80">
          Các khung hình bị lỗi vẫn giữ nguyên mô tả và lời thoại. Nếu backend
          ảnh offline, bạn có thể thử lại hoặc dùng ảnh fallback demo để tiếp
          tục chỉnh truyện và export phần đã có.
        </div>
      </div>
    </div>
  );
}

function StoryboardHeader({
  projectTitle,
  generationSummary,
  onGoToComic,
  onOpenCasting,
  onGenerateAll,
  onOpenExport,
  isGeneratingAll,
  style,
  genre,
  aspectRatio,
}: {
  projectTitle: string;
  generationSummary: GenerationSummary;
  onGoToComic: () => void;
  onOpenCasting: () => void;
  onGenerateAll?: () => void;
  onOpenExport?: () => void;
  isGeneratingAll?: boolean;
  style?: string;
  genre?: string;
  aspectRatio?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      {/* Left: Project title + generation badges */}
      <div className="order-1 mb-2 md:order-1 md:mb-0 md:w-1/2">
        <div className="flex flex-col items-start md:items-start">
          <h1 className="text-xl font-semibold text-text-primary">
            {projectTitle}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface-elevated px-2.5 py-0.5 text-[10px] font-semibold text-text-secondary shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
              Đã vẽ {generationSummary.done}/{generationSummary.total} khung hình
            </span>
            {generationSummary.errors > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-500 dark:text-red-300">
                {generationSummary.errors} khung hình lỗi cần vẽ lại
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCasting}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/20 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30 lg:hidden"
          >
            <Users size={12} />
            <span>Nhân vật</span>
          </button>
        </div>
      </div>

      {/* Right: Actions + below them project meta */}
      <div className="order-2 md:order-2 md:w-1/2">
        <div className="flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-main bg-surface-elevated px-3 text-sm font-medium text-text-primary transition hover:bg-surface"
          >
            <Download size={16} />
            Xuất file
          </button>
          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGeneratingAll}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingAll ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            Vẽ tất cả
          </button>
          <button
            type="button"
            onClick={onGoToComic}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-main bg-surface-elevated px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface"
          >
            <MessageCircle size={16} />
            Chỉnh lời thoại trên ảnh
          </button>
        </div>

        <div className="mt-3 flex justify-end flex-wrap items-center gap-2">
          <div className="rounded-md border border-border-main bg-surface px-2 py-1 text-xs text-text-secondary">
            Phong cách: {style ?? "webtoon"}
          </div>
          <div className="rounded-md border border-border-main bg-surface px-2 py-1 text-xs text-text-secondary">
            Thể loại: {genre ?? "Chưa chọn"}
          </div>
          <div className="rounded-md border border-border-main bg-surface px-2 py-1 text-xs text-text-secondary">
            Tỉ lệ: {aspectRatio ?? "1:1"}
          </div>
        </div>
      </div>
    </div>
  );
}
