export type Theme = "light" | "dark";
const KEY = "drwho-theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function setStoredTheme(theme: Theme | null): void {
  if (typeof window === "undefined") return;
  if (theme === null) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, theme);
}

export function applyTheme(theme: Theme | null): void {
  if (typeof document === "undefined") return;
  if (theme === null) document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}
