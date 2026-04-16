import { buildCapabilities, registerMcpTools } from "@/lib/mcp/server";
import { type McpToolResult, mcpTools } from "@/lib/mcp/tools";
import { describe, expect, it, vi } from "vitest";

describe("registerMcpTools", () => {
  it("calls server.tool() once per MCP tool, with correct (name, description, schema, handler)", () => {
    const toolFn = vi.fn();
    const server = { tool: toolFn };
    registerMcpTools(server);

    expect(toolFn).toHaveBeenCalledTimes(mcpTools.length);
    for (const t of mcpTools) {
      expect(toolFn).toHaveBeenCalledWith(
        t.name,
        t.description,
        t.inputSchema,
        expect.any(Function),
      );
    }
  });

  it("the handler passed through is the MCP tool's handler", async () => {
    const captured: Record<string, (i: Record<string, unknown>) => unknown> = {};
    const server = {
      tool: (name: string, _d: string, _s: unknown, h: (i: Record<string, unknown>) => unknown) => {
        captured[name] = h;
      },
    };
    registerMcpTools(server);

    const uuidHandler = captured.uuid_generate as (
      i: Record<string, unknown>,
    ) => Promise<McpToolResult>;
    const uuid = await uuidHandler({ version: "v4" });
    expect(uuid.content[0].text).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("buildCapabilities", () => {
  it("emits a tools entry with every MCP tool's description", () => {
    const caps = buildCapabilities();
    expect(caps.tools).toBeDefined();
    for (const t of mcpTools) {
      expect(caps.tools[t.name]).toEqual({ description: t.description });
    }
  });
});
