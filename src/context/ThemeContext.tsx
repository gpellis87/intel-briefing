"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeName = "midnight" | "charcoal" | "ocean" | "light";

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  preview: string; // CSS color for the picker swatch
}

export const themes: ThemeConfig[] = [
  { name: "midnight", label: "Midnight", preview: "#0a0e1a" },
  { name: "charcoal", label: "Charcoal", preview: "#1a1a2e" },
  { name: "ocean", label: "Ocean", preview: "#0c1e2e" },
  { name: "light", label: "Light", preview: "#f5f5f7" },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "midnight",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("intel-theme") as ThemeName | null;
    if (stored && themes.some((t) => t.name === stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("intel-theme", t);
  };

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
