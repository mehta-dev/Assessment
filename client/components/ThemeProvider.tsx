"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "light" | "dark";

export type AccentColor =
  | "amber"
  | "blue"
  | "pink"
  | "rose"
  | "emerald"
  | "black";

interface ThemeContextValue {
  theme: ThemeMode;
  accent: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null
  );

interface ThemeProviderProps {
  children: React.ReactNode;
}

const DEFAULT_THEME: ThemeMode = "light";
const DEFAULT_ACCENT: AccentColor = "black";

export default function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] =
    useState<ThemeMode>(DEFAULT_THEME);

  const [accent, setAccentState] =
    useState<AccentColor>(
      DEFAULT_ACCENT
    );

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        "pyramid-theme"
      ) as ThemeMode | null;

    const savedAccent =
      localStorage.getItem(
        "pyramid-accent"
      ) as AccentColor | null;

    if (
      savedTheme === "light" ||
      savedTheme === "dark"
    ) {
      setThemeState(savedTheme);
    }

    if (
      savedAccent === "amber" ||
      savedAccent === "blue" ||
      savedAccent === "pink" ||
      savedAccent === "rose" ||
      savedAccent === "emerald" ||
      savedAccent === "black"
    ) {
      setAccentState(savedAccent);
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const root =
      document.documentElement;

    root.dataset.theme = theme;
    root.dataset.accent = accent;

    root.classList.toggle(
      "dark",
      theme === "dark"
    );

    localStorage.setItem(
      "pyramid-theme",
      theme
    );

    localStorage.setItem(
      "pyramid-accent",
      accent
    );
  }, [theme, accent, mounted]);

  const setTheme = (
    nextTheme: ThemeMode
  ) => {
    setThemeState(nextTheme);
  };

  const setAccent = (
    nextAccent: AccentColor
  ) => {
    setAccentState(nextAccent);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accent,
        setTheme,
        setAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}