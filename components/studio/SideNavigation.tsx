/**
 * @file SideNavigation.tsx
 * @description Primary studio navigation for switching between prototype views.
 */

import {
  FileText,
  LayoutDashboard,
  MessageCircle,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import type { View } from "@/lib/studio/types";

type NavigationItem = {
  id: View;
  label: string;
  icon: ReactNode;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Projects", icon: <LayoutDashboard size={18} /> },
  { id: "import", label: "Import", icon: <FileText size={18} /> },
  { id: "storyboard", label: "Storyboard", icon: <PanelsTopLeft size={18} /> },
  { id: "comic", label: "Comic", icon: <MessageCircle size={18} /> },
];

export function SideNavigation({
  currentView,
  setView,
}: {
  currentView: View;
  setView: (view: View) => void;
}) {
  return (
    <aside className="flex w-20 shrink-0 flex-col items-center border-r border-zinc-800 bg-[#0f0f12] py-4 lg:w-64 lg:items-stretch">
      <BrandMark />
      <nav className="space-y-2 px-3" aria-label="Studio views">
        {NAVIGATION_ITEMS.map((item) => (
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

function BrandMark() {
  return (
    <div className="mb-8 flex items-center justify-center gap-3 px-4 lg:justify-start">
      <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500 text-white">
        <Sparkles size={20} />
      </div>
      <div className="hidden lg:block">
        <div className="text-sm font-semibold">ComicAI Studio</div>
        <div className="text-xs text-zinc-500">Creator workspace</div>
      </div>
    </div>
  );
}
