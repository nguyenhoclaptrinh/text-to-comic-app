/**
 * @file StoryboardWorkspace.tsx
 * @description Storyboard editing workspace with page selection, character casting and panel cards.
 */

import { AlertTriangle, MessageCircle } from "lucide-react";

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
}) {
  const hasBackendError = panels.some((panel) => panel.status === "error");

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[288px_minmax(0,1fr)]">
      <CharacterCastingPanel
        characters={characters}
        onAddCharacter={onAddCharacter}
        onUpdateCharacter={onUpdateCharacter}
      />
      <section className="min-w-0 overflow-y-auto px-4 py-5 lg:px-6">
        {hasBackendError ? <ImageBackendAlert /> : null}
        <StoryboardHeader onGoToComic={onGoToComic} />
        
        <PageSelector
          pages={pages}
          activePageId={activePageId}
          onSelectPage={onSelectPage}
          onAddPage={onAddPage}
          onDeletePage={onDeletePage}
        />

        <div className="space-y-4 pb-8">
          {panels.map((panel) => (
            <StoryboardPanelCard
              key={panel.id}
              panel={panel}
              characters={characters}
              selected={panel.id === selectedPanelId}
              disabled={isGeneratingAll}
              canDelete={panels.length > 1}
              onSelect={() => onSelectPanel(panel.id)}
              onUpdate={(patch) => onUpdatePanel(panel.id, patch)}
              onGenerate={() => onGeneratePanel(panel.id)}
              onDelete={() => onDeletePanel(panel.id)}
            />
          ))}
        </div>
      </section>
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
        <div className="font-semibold">Image backend needs attention</div>
        <div className="mt-1 text-red-100/80">
          Failed panels keep their storyboard text and can be retried one by
          one.
        </div>
      </div>
    </div>
  );
}

function StoryboardHeader({ onGoToComic }: { onGoToComic: () => void }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold">Storyboard Editor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review prompts, dialogue, and panel status.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToComic}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium hover:bg-zinc-800 transition-colors"
      >
        <MessageCircle size={16} />
        Open Comic Editor
      </button>
    </div>
  );
}
