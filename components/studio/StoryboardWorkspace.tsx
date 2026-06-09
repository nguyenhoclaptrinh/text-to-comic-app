/**
 * @file StoryboardWorkspace.tsx
 * @description Storyboard editing workspace with page selection, character casting and panel cards.
 */

import { useState } from "react";
import { AlertTriangle, MessageCircle, Users } from "lucide-react";

import { CharacterCastingPanel } from "@/components/studio/CharacterCastingPanel";
import { StoryboardPanelCard } from "@/components/studio/StoryboardPanelCard";
import { PageSelector } from "@/components/studio/PageSelector";
import type { Character, Page, Panel } from "@/lib/studio/types";

export function StoryboardWorkspace({
  characters,
  pages,
  activePageId,
  panels,
  selectedPanelId,
  isGeneratingAll,
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
  onMovePanel,
  projectStyle,
  projectGenre,
  projectAspectRatio,
}: {
  characters: Character[];
  pages: Page[];
  activePageId: string;
  panels: Panel[];
  selectedPanelId: string;
  isGeneratingAll: boolean;
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
  onMovePanel: (panelId: string, direction: "up" | "down") => void;
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
        className="hidden lg:block"
      />

      {/* Vùng biên tập Storyboard bên phải */}
      <section className="min-w-0 overflow-y-auto px-4 py-5 pb-24 md:pb-8 lg:px-6">
        {hasBackendError ? <ImageBackendAlert /> : null}

        <StoryboardHeader
          onGoToComic={onGoToComic}
          onOpenCasting={() => setIsCastingOpen(true)}
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
          {panels.map((panel, index) => (
            <StoryboardPanelCard
              key={panel.id}
              panel={panel}
              characters={characters}
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
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* RESPONSIVE UI: LEFT SLIDE DRAWER FOR CHARACTER CASTING         */}
      {/* ============================================================== */}

      {/* Slide-out Drawer cho Casting Panel trên di động (< 1024px) */}
      {isCastingOpen && (
        <div className="fixed inset-0 z-40 flex bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
          <div className="relative flex h-full w-[288px] flex-col border-r border-border-main bg-surface-elevated p-4 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="mb-4 flex items-center justify-between border-b border-border-main pb-3">
              <span className="font-semibold text-text-primary">
                👥 Casting Nhân vật
              </span>
              <button
                onClick={() => setIsCastingOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CharacterCastingPanel
                characters={characters}
                onAddCharacter={onAddCharacter}
                onUpdateCharacter={onUpdateCharacter}
                  onDeleteCharacter={onDeleteCharacter}
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
          Các khung hình bị lỗi vẽ ảnh vẫn giữ nguyên văn bản mô tả bối cảnh và
          lời thoại. Bạn có thể thử vẽ lại riêng từng khung mà không mất phần đã
          chỉnh.
        </div>
      </div>
    </div>
  );
}

function StoryboardHeader({
  onGoToComic,
  onOpenCasting,
  style,
  genre,
  aspectRatio,
}: {
  onGoToComic: () => void;
  onOpenCasting: () => void;
  style?: string;
  genre?: string;
  aspectRatio?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text-primary">
            Dựng storyboard
          </h1>
          {/* Nút mở Casting nhanh trên mobile (< 1024px) */}
          <button
            type="button"
            onClick={onOpenCasting}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/20 px-2.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors lg:hidden"
          >
            <Users size={12} />
            <span>Nhân vật</span>
          </button>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Kiểm tra mạch truyện, chỉnh mô tả cảnh và vẽ ảnh cho từng khung.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
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
        <button
        type="button"
        onClick={onGoToComic}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-main bg-surface-elevated px-4 text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
      >
        <MessageCircle size={16} />
        Chỉnh lời thoại trên ảnh
      </button>
      </div>
    </div>
  );
}
