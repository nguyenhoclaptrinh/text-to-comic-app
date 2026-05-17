/**
 * @file TextImport.tsx
 * @description Story text import form with storyboard JSON preview.
 */

import { AlertTriangle, FileText, Loader2, Sparkles } from "lucide-react";

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
  onAnalyze: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
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
          disabled={isAnalyzing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {isAnalyzing ? "Analyzing" : "Analyze Story"}
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
