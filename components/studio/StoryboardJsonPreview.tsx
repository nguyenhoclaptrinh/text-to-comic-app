/**
 * @file StoryboardJsonPreview.tsx
 * @description Static JSON schema preview for story-to-panel analysis.
 */

export function StoryboardJsonPreview() {
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
