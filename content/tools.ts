import type { ComponentType } from "react";

export type ToolCategory = "network" | "dev";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  component: ComponentType;
};

export const tools: Tool[] = [];

export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
