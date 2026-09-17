import { readdirSync } from "node:fs";
import type { Context } from "hono";
import type { FC } from "hono/jsx";

/**
 * Tool views are found by file name: src/views/<dir>/<slug>.tsx, default export.
 * Adding a tool therefore never means editing a shared index file.
 */
async function loadDir<P>(dir: string): Promise<Map<string, FC<P>>> {
  const url = new URL(`./${dir}/`, import.meta.url);
  const found = new Map<string, FC<P>>();
  for (const file of readdirSync(url)) {
    if (!file.endsWith(".tsx")) continue;
    const mod = (await import(new URL(file, url).href)) as { default: FC<P> };
    found.set(file.replace(/\.tsx$/, ""), mod.default);
  }
  return found;
}

export const prose = await loadDir<object>("prose");
export const forms = await loadDir<object>("forms");
export const pages = await loadDir<{ c: Context }>("pages");
