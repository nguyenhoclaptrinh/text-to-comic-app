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
}: {
  characters: Character[];
  pages: Page[];
  activePageId: string;
  panels: Panel[];
  selectedPanelId: string;
  isGeneratingAll: boolean;
  onAddCharacter: () => void;
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
}) {
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const hasBackendError = panels.some((panel) => panel.status === "error");

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[288px_minmax(0,1fr)]">
      {/* Sidebar Casting nhân vật tĩnh trên màn hình lớn */}
      <CharacterCastingPanel
        characters={characters}
        onAddCharacter={onAddCharacter}
        onUpdateCharacter={onUpdateCharacter}
        className="hidden lg:block"
      />

      {/* Vùng biên tập Storyboard bên phải */}
      <section className="min-w-0 overflow-y-auto px-4 py-5 lg:px-6">
        {hasBackendError ? <ImageBackendAlert /> : null}

        <StoryboardHeader
          onGoToComic={onGoToComic}
          onOpenCasting={() => setIsCastingOpen(true)}
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
          <div className="relative flex h-full w-[288px] flex-col border-r border-zinc-800 bg-[#111114] p-4 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-semibold text-zinc-200">
                👥 Casting Nhân vật
              </span>
              <button
                onClick={() => setIsCastingOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CharacterCastingPanel
                characters={characters}
                onAddCharacter={onAddCharacter}
                onUpdateCharacter={onUpdateCharacter}
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
      className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={17} />
      <div>
        <div className="font-semibold">Hệ thống vẽ ảnh cần lưu ý</div>
        <div className="mt-1 text-red-100/80">
          Các khung hình bị lỗi vẽ ảnh vẫn giữ nguyên văn bản mô tả bối cảnh và
          lời thoại, bạn có thể thực hiện thử vẽ lại riêng lẻ từng khung hình.
        </div>
      </div>
    </div>
  );
}

function StoryboardHeader({
  onGoToComic,
  onOpenCasting,
}: {
  onGoToComic: () => void;
  onOpenCasting: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">
            Biên soạn Storyboard
          </h1>
          {/* Nút mở Casting nhanh trên mobile (< 1024px) */}
          <button
            type="button"
            onClick={onOpenCasting}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-violet-500/20 px-2.5 text-xs font-medium text-violet-300 hover:bg-violet-500/30 transition-colors lg:hidden"
          >
            <Users size={12} />
            <span>👥 Casting</span>
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Xem xét và điều chỉnh mô tả bối cảnh, lời thoại nhân vật và trạng thái
          vẽ tranh.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToComic}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        <MessageCircle size={16} />
        Mở Trình biên tập Bong bóng
      </button>
    </div>
  );
}
