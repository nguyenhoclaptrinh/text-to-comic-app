/**
 * @file ThemeContext.tsx
 * @description React Context and hook for managing the light/dark theme state.
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark"); // default to dark

  // Initialize theme from document element class or localStorage
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    const initialTheme: Theme = isDark ? "dark" : "light";
    
    // Use setTimeout to avoid synchronous cascading renders warning in React 19
    const timer = setTimeout(() => {
      setThemeState(initialTheme);
    }, 0);
    
    // Sync the root element class
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    return () => clearTimeout(timer);
  }, []);

  const setTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
