/**
 * @file ComicStudioApp.tsx
 * @description Client-side shell that composes the multi-page comic studio screens.
 */

"use client";

import { ComicEditor } from "@/components/studio/ComicEditor";
import { Dashboard } from "@/components/studio/Dashboard";
import { ExportModal } from "@/components/studio/ExportModal";
import { SideNavigation } from "@/components/studio/SideNavigation";
import { StoryboardWorkspace } from "@/components/studio/StoryboardWorkspace";
import { TextImport } from "@/components/studio/TextImport";
import { TopBar } from "@/components/studio/TopBar";
import { useComicStudioState } from "@/hooks/useComicStudioState";

export function ComicStudioApp() {
  const { state, actions } = useComicStudioState();

  return (
    <main className="flex h-screen min-h-[720px] bg-[#09090b] text-zinc-100 font-sans">
      <SideNavigation currentView={state.view} setView={actions.setView} />
      <section className="flex min-w-0 flex-1 flex-col">
        <TopBar
          projectTitle={state.activeProject.title}
          generationSummary={state.generationSummary}
          onGenerateAll={() => void actions.generateAll()}
          onExport={() => actions.setExportOpen(true)}
          isGeneratingAll={state.isGeneratingAll}
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
    </main>
  );
}

function ActiveView({
  state,
  actions,
}: ReturnType<typeof useComicStudioState>) {
  if (state.view === "dashboard") {
    return (
      <Dashboard
        projects={state.projects}
        activeProjectId={state.activeProjectId}
        onSelectProject={actions.selectProject}
        onNewProject={() => actions.setView("import")}
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
        onAnalyze={() => void actions.analyzeStory()}
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

  return (
    <StoryboardWorkspace
      characters={state.characters}
      pages={state.pages}
      activePageId={state.activePageId}
      panels={state.panels}
      selectedPanelId={state.selectedPanelId}
      isGeneratingAll={state.isGeneratingAll}
      onAddCharacter={actions.addCharacter}
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
      onUpdateCharacter={actions.updateCharacter}
    />
  );
}
