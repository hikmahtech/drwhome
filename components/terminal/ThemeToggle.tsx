"use client";
import { type Theme, applyTheme, getStoredTheme, setStoredTheme } from "@/lib/theme";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setStoredTheme(next);
    applyTheme(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="toggle theme"
      className="border px-2 py-0.5 text-xs"
    >
      {label}
    </button>
  );
}
