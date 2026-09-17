import { findCheck } from "../checks/server";
import { forms, pages } from "../views/load";
import type { Tool } from "./tools";

/** A tool is live once its parts exist. Until then it is listed on the home page but not linked. */
export function isReady(tool: Tool): boolean {
  if (tool.kind === "check") return findCheck(tool.slug) !== undefined;
  if (tool.kind === "live") return forms.has(tool.slug);
  return pages.has(tool.slug);
}
