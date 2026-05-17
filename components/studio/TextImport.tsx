/**
 * @file TextImport.tsx
 * @description Story text import form with mock storyboard JSON preview.
 */

import { AlertTriangle, FileText, Sparkles } from "lucide-react";

export function TextImport({
  title,
  storyText,
  error,
  setTitle,
  setStoryText,
  onAnalyze,
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
        <StoryInputForm
          title={title}
          storyText={storyText}
          error={error}
          setTitle={setTitle}
          setStoryText={setStoryText}
          onAnalyze={onAnalyze}
        />
        <JsonPreview />
      </div>
    </div>
  );
}

function StoryInputForm({
  title,
  storyText,
  error,
  setTitle,
  setStoryText,
  onAnalyze,
}: {
  title: string;
  storyText: string;
  error: string;
  setTitle: (value: string) => void;
  setStoryText: (value: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-[#18181b] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Create New Comic</h1>
          <p className="text-sm text-zinc-400">
            Text import and storyboard analysis.
          </p>
        </div>
      </div>

      <label
        className="mb-2 block text-sm font-medium text-zinc-300"
        htmlFor="project-title"
      >
        Project title
      </label>
      <input
        id="project-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="mb-5 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
      />

      <label
        className="mb-2 block text-sm font-medium text-zinc-300"
        htmlFor="story-text"
      >
        Original story text
      </label>
      <textarea
        id="story-text"
        value={storyText}
        onChange={(event) => setStoryText(event.target.value)}
        className="min-h-80 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-500">
          {storyText.length.toLocaleString()} characters
        </div>
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
        <div
          className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      ) : null}
    </section>
  );
}

function JsonPreview() {
  return (
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
  );
}
