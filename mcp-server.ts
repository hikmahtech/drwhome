#!/usr/bin/env node
import { findMcpTool, mcpTools } from "@/lib/mcp/tools";
/**
 * Stdio MCP server entry point.
 * Used by the Dockerfile so Glama's mcp-proxy can communicate via stdin/stdout.
 * Production traffic uses the HTTP handler at /mcp/mcp instead.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

function zodToSchema(zType: z.ZodTypeAny): Record<string, unknown> {
  const desc = zType._def.description as string | undefined;
  const withDesc = (s: Record<string, unknown>) => (desc ? { ...s, description: desc } : s);
  if (zType instanceof z.ZodOptional) return withDesc(zodToSchema(zType._def.innerType));
  if (zType instanceof z.ZodString) return withDesc({ type: "string" });
  if (zType instanceof z.ZodEnum) return withDesc({ type: "string", enum: zType._def.values });
  if (zType instanceof z.ZodArray)
    return withDesc({ type: "array", items: zodToSchema(zType._def.type) });
  if (zType instanceof z.ZodUnion)
    return withDesc({ oneOf: (zType._def.options as z.ZodTypeAny[]).map(zodToSchema) });
  if (zType instanceof z.ZodLiteral)
    return withDesc({ type: typeof zType._def.value, enum: [zType._def.value] });
  return {};
}

function buildInputSchema(inputSchema: Record<string, z.ZodTypeAny>) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, zType] of Object.entries(inputSchema)) {
    properties[key] = zodToSchema(zType);
    if (!(zType instanceof z.ZodOptional)) required.push(key);
  }
  return { type: "object" as const, properties, required };
}

const server = new Server({ name: "drwhome", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: mcpTools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: buildInputSchema(t.inputSchema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = findMcpTool(request.params.name);
  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }
  return tool.handler(request.params.arguments ?? {});
});

const transport = new StdioServerTransport();
await server.connect(transport);
