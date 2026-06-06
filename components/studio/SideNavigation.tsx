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
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";

import type { View } from "@/lib/studio/types";

type NavigationItem = {
  id: View;
  label: string;
  icon: ReactNode;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "projects", label: "Dự án", icon: <LayoutDashboard size={18} /> },
  { id: "import", label: "Nhập truyện", icon: <Upload size={18} /> },
  { id: "storyboard", label: "Storyboard", icon: <PanelsTopLeft size={18} /> },
  { id: "comic", label: "Chỉnh truyện", icon: <MessageCircle size={18} /> },
  { id: "export", label: "Xuất file", icon: <FileText size={18} /> },
];

export function SideNavigation({
  currentView,
  setView,
}: {
  currentView: View;
  setView: (view: View) => void;
}) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 flex h-16 shrink-0 items-center border-t border-zinc-800 bg-[#0f0f12]/95 px-2 backdrop-blur md:static md:h-auto md:w-20 md:flex-col md:items-center md:border-r md:border-t-0 md:py-4 lg:w-64 lg:items-stretch">
      <BrandMark />
      <nav
        className="grid flex-1 grid-cols-5 gap-1 md:block md:space-y-2 md:px-3"
        aria-label="Luồng tạo truyện"
      >
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => setView(item.id)}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-2 text-xs transition md:gap-3 md:px-3 md:text-sm lg:justify-start ${
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
    <div className="hidden md:mb-8 md:flex md:items-center md:justify-center md:gap-3 md:px-4 lg:justify-start">
      <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500 text-white">
        <Sparkles size={20} />
      </div>
      <div className="hidden lg:block">
        <div className="text-sm font-semibold">ComicAI Studio</div>
        <div className="text-xs text-zinc-500">Xưởng tạo truyện</div>
      </div>
    </div>
  );
}
