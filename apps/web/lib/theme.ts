"use client";

import { useEffect, useMemo, useState } from "react";

export const themeStorageKey = "bm-ds-theme";

export type ThemePreference = "light" | "dark" | "system";

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "dark";
}

function resolveSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system" ? resolveSystemTheme() : preference;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  return useMemo(
    () => ({
      theme,
      setTheme(nextTheme: ThemePreference) {
        window.localStorage.setItem(themeStorageKey, nextTheme);
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      },
    }),
    [theme],
  );
}
