import { mcpTools } from "@/lib/mcp/tools";
import type { z } from "zod";

// Minimal structural type for the mcp-handler `server` object. We only call `tool`.
// Using a structural type keeps this file trivially testable (no SDK instance required).
type McpServerLike = {
  tool: (
    name: string,
    description: string,
    schema: Record<string, z.ZodTypeAny>,
    handler: (input: Record<string, unknown>) => unknown,
  ) => void;
};

export function registerMcpTools(server: McpServerLike): void {
  for (const t of mcpTools) {
    server.tool(t.name, t.description, t.inputSchema, t.handler);
  }
}

export type McpCapabilities = {
  tools: Record<string, { description: string }>;
};

export function buildCapabilities(): McpCapabilities {
  const tools: McpCapabilities["tools"] = {};
  for (const t of mcpTools) tools[t.name] = { description: t.description };
  return { tools };
}
