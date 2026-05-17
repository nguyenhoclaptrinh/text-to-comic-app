/**
 * @file ComicStudioApp.tsx
 * @description Client-side shell that composes the comic studio screens.
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
    <main className="flex h-screen min-h-[720px] bg-[#09090b] text-zinc-100">
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
        setTitle={actions.setStoryTitle}
        setStoryText={actions.setStoryText}
        onAnalyze={actions.analyzeStory}
      />
    );
  }

  if (state.view === "comic") {
    return (
      <ComicEditor
        panels={state.panels}
        selectedPanelId={state.selectedPanelId}
        selectedBubbleId={state.selectedBubbleId}
        selectedBubble={state.selectedBubble}
        dragging={state.dragging}
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
      panels={state.panels}
      selectedPanelId={state.selectedPanelId}
      isGeneratingAll={state.isGeneratingAll}
      onAddCharacter={actions.addCharacter}
      onSelectPanel={(panelId) => {
        actions.setSelectedPanelId(panelId);
        actions.setSelectedBubbleId("");
      }}
      onUpdatePanel={actions.updatePanel}
      onGeneratePanel={(panelId) => void actions.generatePanel(panelId)}
      onGoToComic={() => actions.setView("comic")}
    />
  );
}
