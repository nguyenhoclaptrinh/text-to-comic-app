/**
 * @file SideNavigation.tsx
 * @description Primary studio navigation for switching between prototype views.
 */

import {
  LayoutDashboard,
  MessageCircle,
  PanelsTopLeft,
  Sparkles,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { ReactNode } from "react";

import type { View } from "@/lib/studio/types";

type NavigationItem = {
  id: View;
  label: string;
  icon: ReactNode;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "projects", label: "Dự án", icon: <LayoutDashboard size={18} /> },
  { id: "storyboard", label: "Storyboard", icon: <PanelsTopLeft size={18} /> },
  { id: "comic", label: "Chỉnh truyện", icon: <MessageCircle size={18} /> },
  // Removed explicit "Xuất file" nav item — export is available via topbar action
];

export function SideNavigation({
  currentView,
  setView,
  onOpenSettings,
}: {
  currentView: View;
  setView: (view: View) => void;
  onOpenSettings?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 flex h-15 shrink-0 items-center border-t border-border-main bg-surface/95 px-2 backdrop-blur transition-colors duration-200 md:fixed md:top-0 md:bottom-auto md:inset-x-0 md:w-full md:flex md:h-15 md:flex-row md:items-center md:justify-between md:px-4 md:py-2 lg:items-center lg:px-5">
      <BrandMark />
      <nav
        className="flex flex-1 items-center justify-start gap-2 md:gap-3 lg:gap-4"
        aria-label="Luồng tạo truyện"
      >
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => setView(item.id)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs transition-all md:gap-2 md:px-3 md:text-sm lg:justify-start ${
              currentView === item.id
                ? "border-primary/40 bg-primary/15 text-primary dark:text-white font-semibold"
                : "border-transparent text-text-secondary hover:border-border-main hover:bg-surface-elevated hover:text-text-primary"
            }`}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>
      {/* Controls: theme, settings */}
      <div className="hidden md:ml-2 md:flex md:items-center md:gap-1.5 lg:gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-main bg-surface-elevated text-text-secondary transition hover:bg-surface hover:text-text-primary"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Cấu hình dịch vụ AI"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-main bg-surface-elevated text-text-secondary transition hover:bg-surface hover:text-text-primary"
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div className="hidden md:flex md:items-center md:gap-3 md:px-2 lg:px-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
        <Sparkles size={18} />
      </div>
      <div className="hidden md:block">
        <div className="text-sm font-semibold text-text-primary">ComicAI Studio</div>
        <div className="text-xs text-text-secondary">Xưởng tạo truyện</div>
      </div>
    </div>
  );
}
