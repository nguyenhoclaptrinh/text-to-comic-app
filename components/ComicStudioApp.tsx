"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  PanelsTopLeft,
  Play,
  Plus,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type View = "dashboard" | "import" | "storyboard" | "comic";
type ProjectStatus = "draft" | "storyboard" | "generating" | "done" | "error";
type PanelStatus = "draft" | "generating" | "success" | "error";

type Character = {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
};

type Bubble = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Panel = {
  id: string;
  orderIndex: number;
  scenePrompt: string;
  dialogue: string;
  characterIds: string[];
  status: PanelStatus;
  imageTone: string;
  errorMessage?: string;
  bubbles: Bubble[];
};

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: string;
  panelCount: number;
};

type DragState = {
  panelId: string;
  bubbleId: string;
  offsetX: number;
  offsetY: number;
};

const charactersSeed: Character[] = [
  {
    id: "xiao-se",
    name: "Xiao Se",
    role: "Main protagonist",
    description: "Young man in a white fur coat with a calm, tired expression.",
    color: "#8b5cf6"
  },
  {
    id: "lei-wujie",
    name: "Lei Wujie",
    role: "Sidekick",
    description: "Energetic teenager in a bright red robe.",
    color: "#ef4444"
  }
];

const panelsSeed: Panel[] = [
  {
    id: "panel-1",
    orderIndex: 1,
    scenePrompt:
      "A lonely roadside inn during heavy snow. Xiao Se sits near the window in a white fur coat.",
    dialogue: "Xiao Se: Weather like this will not bring many guests.",
    characterIds: ["xiao-se"],
    status: "success",
    imageTone: "from-slate-900 via-zinc-800 to-indigo-950",
    bubbles: [
      {
        id: "bubble-1",
        text: "Weather like this...",
        x: 28,
        y: 24,
        width: 176,
        height: 58
      }
    ]
  },
  {
    id: "panel-2",
    orderIndex: 2,
    scenePrompt:
      "The wooden door bursts open. Lei Wujie enters in a bright red robe, covered in snow.",
    dialogue: "Lei Wujie: One hot bowl of noodles, please!",
    characterIds: ["lei-wujie"],
    status: "draft",
    imageTone: "from-red-950 via-zinc-800 to-amber-950",
    bubbles: []
  },
  {
    id: "panel-3",
    orderIndex: 3,
    scenePrompt:
      "Xiao Se frowns at the broken door while snow blows into the quiet inn.",
    dialogue: "Xiao Se: You broke the door before ordering.",
    characterIds: ["xiao-se", "lei-wujie"],
    status: "error",
    imageTone: "from-zinc-900 via-stone-800 to-slate-900",
    errorMessage: "Image backend offline. Restart Colab or retry with cached images.",
    bubbles: []
  }
];

const projectSeed: Project[] = [
  {
    id: "project-1",
    title: "Thieu Nien Ca Hanh - Chapter 1",
    status: "storyboard",
    updatedAt: "Today",
    panelCount: 3
  },
  {
    id: "project-2",
    title: "Cyber Alley Short",
    status: "error",
    updatedAt: "Yesterday",
    panelCount: 5
  }
];

const sampleStory =
  "Outside the inn, snow covered the mountain road. A young man in a white fur coat sat by the window, counting the empty tables. Suddenly, the wooden door flew open and a red-robed teenager rushed inside with a bright grin.";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const statusCopy: Record<PanelStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  success: "Done",
  error: "Error"
};

const statusClass: Record<PanelStatus, string> = {
  draft: "border-zinc-700 bg-zinc-900 text-zinc-300",
  generating: "border-violet-400/40 bg-violet-500/15 text-violet-200",
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  error: "border-red-400/40 bg-red-500/15 text-red-200"
};

export function ComicStudioApp() {
  const [view, setView] = useState<View>("storyboard");
  const [projects, setProjects] = useState<Project[]>(projectSeed);
  const [activeProjectId, setActiveProjectId] = useState("project-1");
  const [characters, setCharacters] = useState<Character[]>(charactersSeed);
  const [panels, setPanels] = useState<Panel[]>(panelsSeed);
  const [storyTitle, setStoryTitle] = useState("Snow Road Inn");
  const [storyText, setStoryText] = useState(sampleStory);
  const [importError, setImportError] = useState("");
  const [selectedPanelId, setSelectedPanelId] = useState("panel-1");
  const [selectedBubbleId, setSelectedBubbleId] = useState("bubble-1");
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const selectedPanel = panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];
  const selectedBubble = selectedPanel?.bubbles.find((bubble) => bubble.id === selectedBubbleId);
  const missingImages = panels.filter((panel) => panel.status !== "success").length;

  const generationSummary = useMemo(() => {
    const done = panels.filter((panel) => panel.status === "success").length;
    const errors = panels.filter((panel) => panel.status === "error").length;
    return { done, errors, total: panels.length };
  }, [panels]);

  function selectProject(projectId: string) {
    setActiveProjectId(projectId);
    setView("storyboard");
  }

  function analyzeStory() {
    if (!storyTitle.trim() || !storyText.trim()) {
      setImportError("Title and story text are required.");
      return;
    }

    setImportError("");
    const projectId = `project-${Date.now()}`;
    const nextProject: Project = {
      id: projectId,
      title: storyTitle.trim(),
      status: "storyboard",
      updatedAt: "Just now",
      panelCount: 3
    };

    const generatedPanels = createMockPanels(storyText);
    setProjects((current) => [nextProject, ...current]);
    setActiveProjectId(projectId);
    setPanels(generatedPanels);
    setSelectedPanelId(generatedPanels[0].id);
    setSelectedBubbleId(generatedPanels[0].bubbles[0]?.id ?? "");
    setView("storyboard");
  }

  function updatePanel(panelId: string, patch: Partial<Panel>) {
    setPanels((current) =>
      current.map((panel) => (panel.id === panelId ? { ...panel, ...patch } : panel))
    );
  }

  async function generatePanel(panelId: string) {
    const target = panels.find((panel) => panel.id === panelId);
    if (!target || target.status === "generating") {
      return;
    }

    updatePanel(panelId, { status: "generating", errorMessage: undefined });
    await sleep(850);
    updatePanel(panelId, {
      status: "success",
      imageTone: target.imageTone,
      bubbles:
        target.bubbles.length > 0
          ? target.bubbles
          : [
              {
                id: `bubble-${panelId}-${Date.now()}`,
                text: dialogueToBubble(target.dialogue),
                x: 34,
                y: 26,
                width: 188,
                height: 58
              }
            ]
    });
  }

  async function generateAll() {
    setIsGeneratingAll(true);
    const queue = panels.filter((panel) => panel.status !== "success").map((panel) => panel.id);
    for (const panelId of queue) {
      await generatePanel(panelId);
    }
    setIsGeneratingAll(false);
  }

  function addCharacter() {
    const nextIndex = characters.length + 1;
    setCharacters((current) => [
      ...current,
      {
        id: `character-${Date.now()}`,
        name: `Character ${nextIndex}`,
        role: "Supporting role",
        description: "Add a short visual description before image generation.",
        color: "#06b6d4"
      }
    ]);
  }

  function addBubble(panelId: string) {
    const bubble: Bubble = {
      id: `bubble-${Date.now()}`,
      text: "New speech bubble",
      x: 42,
      y: 42,
      width: 180,
      height: 58
    };
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId ? { ...panel, bubbles: [...panel.bubbles, bubble] } : panel
      )
    );
    setSelectedPanelId(panelId);
    setSelectedBubbleId(bubble.id);
  }

  function updateBubble(panelId: string, bubbleId: string, patch: Partial<Bubble>) {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              bubbles: panel.bubbles.map((bubble) =>
                bubble.id === bubbleId ? { ...bubble, ...patch } : bubble
              )
            }
          : panel
      )
    );
  }

  function deleteBubble(panelId: string, bubbleId: string) {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId
          ? { ...panel, bubbles: panel.bubbles.filter((bubble) => bubble.id !== bubbleId) }
          : panel
      )
    );
    setSelectedBubbleId("");
  }

  function handleBubbleMove(event: React.PointerEvent<HTMLDivElement>, panelId: string) {
    if (!dragging || dragging.panelId !== panelId) {
      return;
    }

    const stage = event.currentTarget.getBoundingClientRect();
    const nextX = clamp(event.clientX - stage.left - dragging.offsetX, 10, stage.width - 210);
    const nextY = clamp(event.clientY - stage.top - dragging.offsetY, 10, stage.height - 80);
    updateBubble(panelId, dragging.bubbleId, { x: Math.round(nextX), y: Math.round(nextY) });
  }

  return (
    <main className="flex h-screen min-h-[720px] bg-[#09090b] text-zinc-100">
      <SideNavigation currentView={view} setView={setView} />
      <section className="flex min-w-0 flex-1 flex-col">
        <TopBar
          projectTitle={activeProject.title}
          generationSummary={generationSummary}
          onGenerateAll={() => void generateAll()}
          onExport={() => setExportOpen(true)}
          isGeneratingAll={isGeneratingAll}
        />

        {view === "dashboard" ? (
          <Dashboard
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={selectProject}
            onNewProject={() => setView("import")}
          />
        ) : null}

        {view === "import" ? (
          <TextImport
            title={storyTitle}
            storyText={storyText}
            error={importError}
            setTitle={setStoryTitle}
            setStoryText={setStoryText}
            onAnalyze={analyzeStory}
          />
        ) : null}

        {view === "storyboard" ? (
          <StoryboardWorkspace
            characters={characters}
            panels={panels}
            selectedPanelId={selectedPanelId}
            isGeneratingAll={isGeneratingAll}
            onAddCharacter={addCharacter}
            onSelectPanel={(panelId) => {
              setSelectedPanelId(panelId);
              setSelectedBubbleId("");
            }}
            onUpdatePanel={updatePanel}
            onGeneratePanel={(panelId) => void generatePanel(panelId)}
            onGoToComic={() => setView("comic")}
          />
        ) : null}

        {view === "comic" ? (
          <ComicEditor
            panels={panels}
            selectedPanelId={selectedPanelId}
            selectedBubbleId={selectedBubbleId}
            selectedBubble={selectedBubble}
            dragging={dragging}
            onSelectPanel={setSelectedPanelId}
            onSelectBubble={setSelectedBubbleId}
            onAddBubble={addBubble}
            onUpdateBubble={updateBubble}
            onDeleteBubble={deleteBubble}
            onStartDrag={setDragging}
            onStopDrag={() => setDragging(null)}
            onBubbleMove={handleBubbleMove}
          />
        ) : null}
      </section>

      {exportOpen ? (
        <ExportModal
          missingImages={missingImages}
          onClose={() => setExportOpen(false)}
          onGoToStoryboard={() => {
            setExportOpen(false);
            setView("storyboard");
          }}
        />
      ) : null}
    </main>
  );
}

function SideNavigation({
  currentView,
  setView
}: {
  currentView: View;
  setView: (view: View) => void;
}) {
  const items: Array<{ id: View; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Projects", icon: <LayoutDashboard size={18} /> },
    { id: "import", label: "Import", icon: <FileText size={18} /> },
    { id: "storyboard", label: "Storyboard", icon: <PanelsTopLeft size={18} /> },
    { id: "comic", label: "Comic", icon: <MessageCircle size={18} /> }
  ];

  return (
    <aside className="flex w-20 shrink-0 flex-col items-center border-r border-zinc-800 bg-[#0f0f12] py-4 lg:w-64 lg:items-stretch">
      <div className="mb-8 flex items-center justify-center gap-3 px-4 lg:justify-start">
        <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500 text-white">
          <Sparkles size={20} />
        </div>
        <div className="hidden lg:block">
          <div className="text-sm font-semibold">ComicAI Studio</div>
          <div className="text-xs text-zinc-500">Creator workspace</div>
        </div>
      </div>

      <nav className="space-y-2 px-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => setView(item.id)}
            className={`flex h-11 w-full items-center justify-center gap-3 rounded-lg border px-3 text-sm transition lg:justify-start ${
              currentView === item.id
                ? "border-violet-400/40 bg-violet-500/15 text-white"
                : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="hidden lg:inline">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function TopBar({
  projectTitle,
  generationSummary,
  isGeneratingAll,
  onGenerateAll,
  onExport
}: {
  projectTitle: string;
  generationSummary: { done: number; errors: number; total: number };
  isGeneratingAll: boolean;
  onGenerateAll: () => void;
  onExport: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#101014]/95 px-4 lg:px-6">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{projectTitle}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {generationSummary.done}/{generationSummary.total} panels done
          </span>
          {generationSummary.errors > 0 ? (
            <span className="text-red-300">{generationSummary.errors} needs retry</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          type="button"
          onClick={onGenerateAll}
          disabled={isGeneratingAll}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGeneratingAll ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          <span className="hidden sm:inline">Generate All</span>
        </button>
      </div>
    </header>
  );
}

function Dashboard({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject
}: {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Projects</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Continue a draft, retry failed panels, or start a new comic.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectProject(project.id)}
            className={`min-h-56 rounded-xl border bg-[#18181b] p-4 text-left transition hover:border-violet-400/50 ${
              activeProjectId === project.id ? "border-violet-400/60" : "border-zinc-800"
            }`}
          >
            <div className="mb-4 grid h-28 grid-cols-3 gap-2 rounded-lg bg-zinc-950 p-3">
              <div className="rounded-md bg-slate-800" />
              <div className="rounded-md bg-zinc-700" />
              <div className="rounded-md bg-stone-700" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 truncate text-base font-semibold text-white">{project.title}</h2>
              <ProjectStatusPill status={project.status} />
            </div>
            <div className="mt-3 text-sm text-zinc-400">
              {project.panelCount} panels · Updated {project.updatedAt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TextImport({
  title,
  storyText,
  error,
  setTitle,
  setStoryText,
  onAnalyze
}: {
  title: string;
  storyText: string;
  error: string;
  setTitle: (value: string) => void;
  setStoryText: (value: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-zinc-800 bg-[#18181b] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Create New Comic</h1>
              <p className="text-sm text-zinc-400">Text import and storyboard analysis.</p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="project-title">
            Project title
          </label>
          <input
            id="project-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mb-5 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
          />

          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="story-text">
            Original story text
          </label>
          <textarea
            id="story-text"
            value={storyText}
            onChange={(event) => setStoryText(event.target.value)}
            className="min-h-80 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-500">{storyText.length.toLocaleString()} characters</div>
            <button
              type="button"
              onClick={onAnalyze}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              <Sparkles size={16} />
              Analyze Story
            </button>
          </div>

          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertTriangle size={16} />
              {error}
            </div>
          ) : null}
        </section>

        <aside className="rounded-xl border border-zinc-800 bg-[#18181b] p-5">
          <h2 className="mb-4 text-base font-semibold">Storyboard JSON Preview</h2>
          <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">
            <div>{"{"}</div>
            <div className="pl-4">{'"panels": ['}</div>
            <div className="pl-8">{"{"}</div>
            <div className="pl-12">{'"orderIndex": 1,'}</div>
            <div className="pl-12">{'"scenePrompt": "...",'}</div>
            <div className="pl-12">{'"characters": ["Xiao Se"],'}</div>
            <div className="pl-12">{'"dialogue": "..."'}</div>
            <div className="pl-8">{"}"}</div>
            <div className="pl-4">{"]"}</div>
            <div>{"}"}</div>
          </div>
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            Demo limit: keep source text short enough for one storyboard pass.
          </div>
        </aside>
      </div>
    </div>
  );
}

function StoryboardWorkspace({
  characters,
  panels,
  selectedPanelId,
  isGeneratingAll,
  onAddCharacter,
  onSelectPanel,
  onUpdatePanel,
  onGeneratePanel,
  onGoToComic
}: {
  characters: Character[];
  panels: Panel[];
  selectedPanelId: string;
  isGeneratingAll: boolean;
  onAddCharacter: () => void;
  onSelectPanel: (panelId: string) => void;
  onUpdatePanel: (panelId: string, patch: Partial<Panel>) => void;
  onGeneratePanel: (panelId: string) => void;
  onGoToComic: () => void;
}) {
  const hasBackendError = panels.some((panel) => panel.status === "error");

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[288px_minmax(0,1fr)]">
      <aside className="hidden border-r border-zinc-800 bg-[#111114] p-4 lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Casting</h2>
          <button
            type="button"
            onClick={onAddCharacter}
            aria-label="Add character"
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {characters.map((character) => (
            <article key={character.id} className="rounded-lg border border-zinc-800 bg-[#18181b] p-3">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: character.color }}
                >
                  {character.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{character.name}</div>
                  <div className="truncate text-xs text-zinc-500">{character.role}</div>
                </div>
              </div>
              <p className="text-xs leading-5 text-zinc-400">{character.description}</p>
              <button
                type="button"
                className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-2 text-xs text-zinc-300 hover:bg-zinc-900"
              >
                <Upload size={13} />
                Reference
              </button>
            </article>
          ))}
        </div>
      </aside>

      <section className="min-w-0 overflow-y-auto px-4 py-5 lg:px-6">
        {hasBackendError ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 shrink-0" size={17} />
            <div>
              <div className="font-semibold">Image backend needs attention</div>
              <div className="mt-1 text-red-100/80">
                Failed panels keep their storyboard text and can be retried one by one.
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Storyboard Editor</h1>
            <p className="mt-1 text-sm text-zinc-400">Review prompts, dialogue, and panel status.</p>
          </div>
          <button
            type="button"
            onClick={onGoToComic}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium hover:bg-zinc-800"
          >
            <MessageCircle size={16} />
            Open Comic Editor
          </button>
        </div>

        <div className="space-y-4 pb-8">
          {panels.map((panel) => (
            <StoryboardPanelCard
              key={panel.id}
              panel={panel}
              characters={characters}
              selected={panel.id === selectedPanelId}
              disabled={isGeneratingAll}
              onSelect={() => onSelectPanel(panel.id)}
              onUpdate={(patch) => onUpdatePanel(panel.id, patch)}
              onGenerate={() => onGeneratePanel(panel.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function StoryboardPanelCard({
  panel,
  characters,
  selected,
  disabled,
  onSelect,
  onUpdate,
  onGenerate
}: {
  panel: Panel;
  characters: Character[];
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Panel>) => void;
  onGenerate: () => void;
}) {
  return (
    <article
      className={`grid overflow-hidden rounded-xl border bg-[#18181b] shadow-lg lg:grid-cols-[minmax(0,1fr)_360px] ${
        selected ? "border-violet-400/60" : "border-zinc-800"
      }`}
    >
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-2 rounded-md text-left text-sm font-semibold text-white"
          >
            <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
              PANEL {panel.orderIndex}
            </span>
            <StatusBadge status={panel.status} />
          </button>
          <button
            type="button"
            aria-label="Delete panel"
            className="flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Scene prompt
        </label>
        <textarea
          value={panel.scenePrompt}
          onChange={(event) => onUpdate({ scenePrompt: event.target.value })}
          className="mb-4 min-h-24 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
        />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Dialogue
        </label>
        <textarea
          value={panel.dialogue}
          onChange={(event) => onUpdate({ dialogue: event.target.value })}
          className="mb-4 min-h-16 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
        />

        <div className="flex flex-wrap gap-2">
          {panel.characterIds.map((characterId) => {
            const character = characters.find((item) => item.id === characterId);
            return (
              <span
                key={characterId}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
              >
                {character?.name ?? characterId}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-72 flex-col border-t border-zinc-800 bg-zinc-950 p-4 lg:border-l lg:border-t-0">
        <PanelPreview panel={panel} compact={false} />
        <div className="mt-4 flex items-center justify-between gap-3">
          {panel.errorMessage ? (
            <div className="min-w-0 text-xs text-red-200">{panel.errorMessage}</div>
          ) : (
            <div className="text-xs text-zinc-500">Image state: {statusCopy[panel.status]}</div>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled || panel.status === "generating"}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {panel.status === "generating" ? (
              <Loader2 className="animate-spin" size={15} />
            ) : panel.status === "success" ? (
              <RotateCw size={15} />
            ) : (
              <ImageIcon size={15} />
            )}
            {panel.status === "success" ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ComicEditor({
  panels,
  selectedPanelId,
  selectedBubbleId,
  selectedBubble,
  dragging,
  onSelectPanel,
  onSelectBubble,
  onAddBubble,
  onUpdateBubble,
  onDeleteBubble,
  onStartDrag,
  onStopDrag,
  onBubbleMove
}: {
  panels: Panel[];
  selectedPanelId: string;
  selectedBubbleId: string;
  selectedBubble?: Bubble;
  dragging: DragState | null;
  onSelectPanel: (panelId: string) => void;
  onSelectBubble: (bubbleId: string) => void;
  onAddBubble: (panelId: string) => void;
  onUpdateBubble: (panelId: string, bubbleId: string, patch: Partial<Bubble>) => void;
  onDeleteBubble: (panelId: string, bubbleId: string) => void;
  onStartDrag: (dragState: DragState) => void;
  onStopDrag: () => void;
  onBubbleMove: (event: React.PointerEvent<HTMLDivElement>, panelId: string) => void;
}) {
  const selectedPanel = panels.find((panel) => panel.id === selectedPanelId) ?? panels[0];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_260px]">
      <aside className="hidden border-r border-zinc-800 bg-[#111114] p-4 xl:block">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Bubble Tools</h2>
        <button
          type="button"
          onClick={() => onAddBubble(selectedPanel.id)}
          className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-sm font-semibold text-white hover:bg-violet-400"
        >
          <Plus size={16} />
          Add Bubble
        </button>

        <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
          <div className="mb-3 text-sm font-semibold">Selected Bubble</div>
          {selectedBubble ? (
            <>
              <label className="mb-2 block text-xs font-medium text-zinc-500" htmlFor="bubble-text">
                Text
              </label>
              <textarea
                id="bubble-text"
                value={selectedBubble.text}
                onChange={(event) =>
                  onUpdateBubble(selectedPanel.id, selectedBubble.id, { text: event.target.value })
                }
                className="mb-3 min-h-24 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm text-zinc-100"
              />
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div className="rounded-md bg-zinc-950 p-2">x: {selectedBubble.x}</div>
                <div className="rounded-md bg-zinc-950 p-2">y: {selectedBubble.y}</div>
                <div className="rounded-md bg-zinc-950 p-2">w: {selectedBubble.width}</div>
                <div className="rounded-md bg-zinc-950 p-2">h: {selectedBubble.height}</div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteBubble(selectedPanel.id, selectedBubble.id)}
                className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 text-sm text-red-200 hover:bg-red-500/10"
              >
                <Trash2 size={14} />
                Delete Bubble
              </button>
            </>
          ) : (
            <p className="text-sm leading-6 text-zinc-400">Select a bubble on the preview or add one.</p>
          )}
        </div>
      </aside>

      <section className="overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Comic Editor</h1>
            <p className="mt-1 text-sm text-zinc-400">Speech bubbles are saved per panel in mock state.</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
          >
            <Save size={15} />
            Save
          </button>
        </div>

        <div className="mx-auto max-w-3xl space-y-5 pb-8">
          {panels.map((panel) => (
            <article key={panel.id} className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectPanel(panel.id)}
                  className="text-sm font-semibold text-zinc-100"
                >
                  Panel {panel.orderIndex}
                </button>
                <StatusBadge status={panel.status} />
              </div>
              <div
                className={`relative h-[320px] overflow-hidden rounded-lg border border-zinc-700 bg-gradient-to-br ${panel.imageTone}`}
                onPointerMove={(event) => onBubbleMove(event, panel.id)}
                onPointerUp={onStopDrag}
                onPointerLeave={() => {
                  if (dragging?.panelId === panel.id) {
                    onStopDrag();
                  }
                }}
              >
                <ComicPanelArt panel={panel} />
                {panel.bubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    type="button"
                    onPointerDown={(event) => {
                      const bubbleBox = event.currentTarget.getBoundingClientRect();
                      onSelectPanel(panel.id);
                      onSelectBubble(bubble.id);
                      onStartDrag({
                        panelId: panel.id,
                        bubbleId: bubble.id,
                        offsetX: event.clientX - bubbleBox.left,
                        offsetY: event.clientY - bubbleBox.top
                      });
                    }}
                    className={`comic-text absolute rounded-[24px] rounded-bl-md border-2 border-black bg-white p-3 text-left text-sm font-bold leading-5 text-zinc-950 shadow-lg transition ${
                      selectedBubbleId === bubble.id ? "ring-2 ring-violet-400" : ""
                    }`}
                    style={{
                      left: bubble.x,
                      top: bubble.y,
                      width: bubble.width,
                      minHeight: bubble.height
                    }}
                  >
                    {bubble.text}
                  </button>
                ))}
                {panel.status !== "success" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm text-zinc-200">
                    {panel.status === "error" ? "Panel image missing" : "Generate panel before export"}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="hidden border-l border-zinc-800 bg-[#111114] p-4 xl:block">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Panel List</h2>
        <div className="space-y-2">
          {panels.map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => onSelectPanel(panel.id)}
              className={`flex h-12 w-full items-center justify-between rounded-lg border px-3 text-left text-sm ${
                selectedPanelId === panel.id
                  ? "border-violet-400/60 bg-violet-500/15"
                  : "border-zinc-800 bg-[#18181b] hover:bg-zinc-900"
              }`}
            >
              <span>Panel {panel.orderIndex}</span>
              <span className="text-xs text-zinc-500">{panel.bubbles.length} bubbles</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function PanelPreview({ panel, compact }: { panel: Panel; compact: boolean }) {
  return (
    <div
      className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-zinc-700 bg-gradient-to-br ${panel.imageTone} ${
        compact ? "min-h-40" : "min-h-52"
      }`}
    >
      {panel.status === "generating" ? (
        <div className="flex flex-col items-center gap-3 text-violet-100">
          <Loader2 className="animate-spin" size={34} />
          <div className="text-sm">Rendering panel...</div>
        </div>
      ) : panel.status === "error" ? (
        <div className="flex flex-col items-center gap-3 text-red-100">
          <AlertTriangle size={34} />
          <div className="text-sm">Generation failed</div>
        </div>
      ) : panel.status === "draft" ? (
        <div className="flex flex-col items-center gap-3 text-zinc-300">
          <ImageIcon size={34} />
          <div className="text-sm">No image yet</div>
        </div>
      ) : (
        <ComicPanelArt panel={panel} />
      )}
    </div>
  );
}

function ComicPanelArt({ panel }: { panel: Panel }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[9%] top-[14%] h-[62%] w-[28%] rounded-full bg-white/10 blur-sm" />
      <div className="absolute bottom-[18%] right-[12%] h-[42%] w-[24%] rounded-full bg-amber-300/10 blur-sm" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/35" />
      <div className="absolute bottom-8 left-[14%] h-24 w-16 rounded-t-full bg-zinc-200/20" />
      <div className="absolute bottom-8 right-[18%] h-28 w-20 rounded-t-full bg-red-300/20" />
      <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
        Panel {panel.orderIndex}
      </div>
    </div>
  );
}

function ExportModal({
  missingImages,
  onClose,
  onGoToStoryboard
}: {
  missingImages: number;
  onClose: () => void;
  onGoToStoryboard: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 8));
    }, 160);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#18181b] p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="export-title" className="text-xl font-semibold">
              Export Comic
            </h2>
            <p className="mt-1 text-sm text-zinc-400">PNG vertical is the MVP export format.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
            <CheckCircle2 className="text-emerald-300" size={20} />
            <div>
              <div className="text-sm font-semibold text-white">PNG vertical</div>
              <div className="text-xs text-emerald-100/80">Includes generated panels and bubbles.</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 opacity-70">
            <FileText className="text-zinc-400" size={20} />
            <div>
              <div className="text-sm font-semibold text-white">PDF</div>
              <div className="text-xs text-zinc-500">Optional backlog item.</div>
            </div>
          </div>

          {missingImages > 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <div>
                <div className="font-semibold">{missingImages} panel needs image generation.</div>
                <button
                  type="button"
                  onClick={onGoToStoryboard}
                  className="mt-2 inline-flex h-8 items-center gap-2 rounded-lg border border-amber-300/30 px-3 text-xs font-semibold hover:bg-amber-500/10"
                >
                  <Play size={13} />
                  Return to storyboard
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Rendering export canvas</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400"
          >
            <Download size={16} />
            Export PNG
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: PanelStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass[status]}`}>
      {status === "generating" ? <Loader2 className="mr-1 inline animate-spin" size={12} /> : null}
      {statusCopy[status]}
    </span>
  );
}

function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const className =
    status === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-200"
      : status === "done"
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
        : "border-violet-400/30 bg-violet-500/10 text-violet-200";

  return (
    <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function createMockPanels(storyText: string): Panel[] {
  const excerpt = storyText.trim().slice(0, 84);
  return [
    {
      id: `panel-${Date.now()}-1`,
      orderIndex: 1,
      scenePrompt: `${excerpt}... Establish the location, mood, and first character.`,
      dialogue: "Narrator: The story begins under a cold sky.",
      characterIds: ["xiao-se"],
      status: "draft",
      imageTone: "from-slate-900 via-zinc-800 to-indigo-950",
      bubbles: []
    },
    {
      id: `panel-${Date.now()}-2`,
      orderIndex: 2,
      scenePrompt: "A second character enters the scene and changes the rhythm of the moment.",
      dialogue: "New arrival: I finally found this place.",
      characterIds: ["lei-wujie"],
      status: "draft",
      imageTone: "from-red-950 via-zinc-800 to-amber-950",
      bubbles: []
    },
    {
      id: `panel-${Date.now()}-3`,
      orderIndex: 3,
      scenePrompt: "The two characters react to each other, setting up the next scene.",
      dialogue: "Xiao Se: This will cost you.",
      characterIds: ["xiao-se", "lei-wujie"],
      status: "draft",
      imageTone: "from-zinc-900 via-stone-800 to-slate-900",
      bubbles: []
    }
  ];
}

function dialogueToBubble(dialogue: string) {
  const [, text = dialogue] = dialogue.split(":");
  return text.trim().slice(0, 72);
}
