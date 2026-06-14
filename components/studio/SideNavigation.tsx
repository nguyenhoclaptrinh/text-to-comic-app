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
    <aside className="fixed inset-x-0 bottom-0 z-40 flex h-16 shrink-0 items-center border-t border-border-main/60 bg-surface/90 px-4 backdrop-blur-md transition-colors duration-200 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:h-16 md:w-full md:px-6">
      {/* Cột trái: Brand logo (căn trái) */}
      <div className="hidden md:flex md:flex-1 md:items-center md:justify-start">
        <BrandMark />
      </div>

      {/* Cột giữa: Thanh điều hướng chuyển màn hình (căn giữa màn hình) */}
      <nav
        className="flex flex-1 items-center justify-center gap-3 md:flex-initial md:gap-5 lg:gap-6"
        aria-label="Luồng tạo truyện"
      >
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => setView(item.id)}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs md:text-sm transition-all duration-200 active:scale-95 ${
              currentView === item.id
                ? "border-primary/30 bg-primary/10 text-primary dark:text-violet-200 dark:bg-primary/20 shadow-[0_0_12px_rgba(139,92,246,0.12)] font-semibold"
                : "border-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Cột phải: Cấu hình hệ thống (căn phải) */}
      <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-main bg-surface-elevated/50 text-text-secondary transition-all hover:bg-surface-elevated hover:text-text-primary active:scale-95"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Cấu hình dịch vụ AI"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-main bg-surface-elevated/50 text-text-secondary transition-all hover:bg-surface-elevated hover:text-text-primary active:scale-95"
        >
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-primary/20">
        <Sparkles size={18} />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-wide text-text-primary">ComicAI Studio</div>
        <div className="text-xs text-text-secondary leading-none mt-0.5">Xưởng tạo truyện</div>
      </div>
    </div>
  );
}
