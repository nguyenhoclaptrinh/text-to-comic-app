/**
 * @file ComicStudioApp.tsx
 * @description Client-side shell that composes the multi-page comic studio screens.
 */

"use client";

import { useState } from "react";
import { Download, ImageOff, PanelsTopLeft } from "lucide-react";
import { ComicEditor } from "@/components/studio/ComicEditor";
import { Dashboard } from "@/components/studio/Dashboard";
import { ExportModal } from "@/components/studio/ExportModal";
import { SideNavigation } from "@/components/studio/SideNavigation";
import { StoryboardWorkspace } from "@/components/studio/StoryboardWorkspace";
import { TopBar } from "@/components/studio/TopBar";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { TextImport } from "@/components/studio/TextImport";
import { useComicStudioState } from "@/hooks/useComicStudioState";

export function ComicStudioApp() {
  const { state, actions } = useComicStudioState();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <main className="flex min-h-dvh bg-background text-text-primary font-sans transition-colors duration-200">
      <SideNavigation currentView={state.view} setView={actions.setView} />
      <section className="flex min-w-0 flex-1 flex-col">
        <TopBar
          projectTitle={state.activeProject.title}
          generationSummary={state.generationSummary}
          onGenerateAll={() => void actions.generateAll()}
          onExport={() => actions.setExportOpen(true)}
          isGeneratingAll={state.isGeneratingAll}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <ActiveView state={state} actions={actions} />
      </section>
      {state.exportOpen ? (
        <ExportModal
          panels={state.allPanels}
          projectTitle={state.activeProject.title}
          missingImages={state.missingImages}
          onClose={() => actions.setExportOpen(false)}
          onGoToStoryboard={() => {
            actions.setExportOpen(false);
            actions.setView("storyboard");
          }}
        />
      ) : null}
      {isSettingsOpen ? (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          activeProject={state.activeProject}
          onUpdateProjectStyle={actions.updateProjectStyle}
        />
      ) : null}
    </main>
  );
}

function ActiveView({
  state,
  actions,
}: ReturnType<typeof useComicStudioState>) {
  if (state.view === "projects") {
    return (
      <Dashboard
        projects={state.projects}
        activeProjectId={state.activeProjectId}
          onSelectProject={actions.selectProject}
          onAnalyze={(title, text, style, genre, aspectRatio) =>
            actions.analyzeStory(style, title, text, genre, aspectRatio)
          }
        isAnalyzing={state.isAnalyzingStory}
        importError={state.importError}
      />
    );
  }

  if (state.view === "import") {
    return (
      <TextImport
        title={state.storyTitle}
        storyText={state.storyText}
        error={state.importError}
        isAnalyzing={state.isAnalyzingStory}
        setTitle={actions.setStoryTitle}
        setStoryText={actions.setStoryText}
        onAnalyze={(style) => void actions.analyzeStory(style)}
      />
    );
  }

  if (state.view === "comic") {
    return (
      <ComicEditor
        pages={state.pages}
        activePageId={state.activePageId}
        panels={state.panels}
        selectedPanelId={state.selectedPanelId}
        selectedBubbleId={state.selectedBubbleId}
        selectedBubble={state.selectedBubble}
        dragging={state.dragging}
        onSelectPage={actions.setActivePageId}
        onAddPage={actions.addPage}
        onDeletePage={actions.deletePage}
        onSelectPanel={actions.setSelectedPanelId}
        onSelectBubble={actions.setSelectedBubbleId}
        onAddBubble={actions.addBubble}
        onUpdateBubble={actions.updateBubble}
        onDeleteBubble={actions.deleteBubble}
        onStartDrag={actions.setDragging}
        onStopDrag={() => actions.setDragging(null)}
        onBubbleMove={actions.handleBubbleMove}
      />
    );
  }

  if (state.view === "export") {
    return (
      <ExportStep
        missingImages={state.missingImages}
        generatedPanels={state.generationSummary.done}
        totalPanels={state.generationSummary.total}
        onOpenExport={() => actions.setExportOpen(true)}
        onGoToStoryboard={() => actions.setView("storyboard")}
      />
    );
  }

  return (
    <StoryboardWorkspace
      characters={state.characters}
      pages={state.pages}
      activePageId={state.activePageId}
      panels={state.panels}
      selectedPanelId={state.selectedPanelId}
      isGeneratingAll={state.isGeneratingAll}
      onAddCharacter={actions.addCharacter}
        onDeleteCharacter={actions.deleteCharacter}
      onSelectPage={actions.setActivePageId}
      onAddPage={actions.addPage}
      onDeletePage={actions.deletePage}
      onSelectPanel={(panelId) => {
        actions.setSelectedPanelId(panelId);
        actions.setSelectedBubbleId("");
      }}
      onUpdatePanel={actions.updatePanel}
      onGeneratePanel={(panelId) => void actions.generatePanel(panelId)}
        onDeletePanel={actions.deletePanel}
        onGoToComic={() => actions.setView("comic")}
        onGoToImport={() => actions.setView("import")}
        onUpdateCharacter={actions.updateCharacter}
        onMovePanel={actions.movePanel}
      projectStyle={state.activeProject.style}
      projectGenre={state.activeProject.genre}
      projectAspectRatio={state.activeProject.aspectRatio}
    />
  );
}

function ExportStep({
  missingImages,
  generatedPanels,
  totalPanels,
  onOpenExport,
  onGoToStoryboard,
}: {
  missingImages: number;
  generatedPanels: number;
  totalPanels: number;
  onOpenExport: () => void;
  onGoToStoryboard: () => void;
}) {
  const canExport = generatedPanels > 0;

  return (
    <section className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#18181b] p-5 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
            <Download size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Xuất truyện thành file chia sẻ
            </h1>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              App sẽ ghép các khung đã vẽ và bong bóng thoại thành một ảnh dọc
              kiểu webtoon. Đây là đường xuất chính cho bản demo.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="text-sm font-semibold text-zinc-100">
              {generatedPanels}/{totalPanels} khung đã có ảnh
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width:
                    totalPanels > 0
                      ? `${Math.round((generatedPanels / totalPanels) * 100)}%`
                      : "0%",
                }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              {missingImages > 0 ? (
                <ImageOff size={16} />
              ) : (
                <PanelsTopLeft size={16} />
              )}
              {missingImages > 0
                ? `${missingImages} khung cần vẽ thêm`
                : "Đã sẵn sàng xuất bản"}
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Nếu còn thiếu ảnh, bạn vẫn có thể quay lại storyboard để vẽ nốt
              trước khi xuất.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {missingImages > 0 ? (
            <button
              type="button"
              onClick={onGoToStoryboard}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
            >
              <PanelsTopLeft size={16} />
              Quay lại vẽ ảnh
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenExport}
            disabled={!canExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} />
            Mở hộp thoại xuất file
          </button>
        </div>
      </div>
    </section>
  );
}
