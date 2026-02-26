"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type ThemeName = "system" | "midnight" | "charcoal" | "ocean" | "light";

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  preview: string;
}

export const themes: ThemeConfig[] = [
  { name: "system", label: "System (Auto)", preview: "linear-gradient(135deg, #0a0e1a 50%, #f5f5f7 50%)" },
  { name: "midnight", label: "Midnight", preview: "#0a0e1a" },
  { name: "charcoal", label: "Charcoal", preview: "#1a1a2e" },
  { name: "ocean", label: "Ocean", preview: "#0c1e2e" },
  { name: "light", label: "Light", preview: "#f5f5f7" },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resolvedTheme: "midnight" | "charcoal" | "ocean" | "light";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "midnight",
});

function getSystemTheme(): "midnight" | "light" {
  if (typeof window === "undefined") return "midnight";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "midnight"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("system");
  const [systemPref, setSystemPref] = useState<"midnight" | "light">("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("intel-theme") as ThemeName | null;
    if (stored && themes.some((t) => t.name === stored)) {
      setThemeState(stored);
    }
    setSystemPref(getSystemTheme());
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? "midnight" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: "midnight" | "charcoal" | "ocean" | "light" =
    theme === "system" ? systemPref : (theme as "midnight" | "charcoal" | "ocean" | "light");

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("intel-theme", t);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", resolvedTheme);
    }
  }, [resolvedTheme, mounted]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
