import type { ComponentType } from "react";
import { Base64 } from "@/components/tools/Base64";

export type ToolCategory = "network" | "dev";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  component: ComponentType;
};

export const tools: Tool[] = [
  {
    slug: "base64",
    name: "base64",
    description: "encode and decode base64 strings (client-side, unicode-safe).",
    category: "dev",
    keywords: ["base64", "encode", "decode", "encoder", "decoder"],
    component: Base64,
  },
];

export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
