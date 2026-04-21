import { findMcpTool, mcpTools } from "@/lib/mcp/tools";
import { describe, expect, it } from "vitest";

describe("mcpTools", () => {
  it("exposes exactly the 13 MCP tools from the design spec", () => {
    const names = mcpTools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "base64_decode",
        "base64_encode",
        "dns_lookup",
        "dossier_dns",
        "dossier_mx",
        "dossier_spf",
        "ip_lookup",
        "json_format",
        "jwt_decode",
        "url_decode",
        "url_encode",
        "user_agent_parse",
        "uuid_generate",
      ].sort(),
    );
  });

  it("every tool name uses snake_case with no dashes", () => {
    for (const t of mcpTools) {
      expect(t.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("every tool has a non-empty description and an input schema", () => {
    for (const t of mcpTools) {
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.inputSchema).toBeDefined();
    }
  });

  it("every tool slug points at a real web tool slug (or null for mocked)", () => {
    const validSlugs = new Set([
      "dossier-dns",
      "dossier-mx",
      "dossier-spf",
      "dns",
      "ip-lookup",
      "json",
      "base64",
      "url-codec",
      "jwt",
      "user-agent",
      "uuid",
    ]);
    for (const t of mcpTools) {
      expect(validSlugs.has(t.slug)).toBe(true);
    }
  });

  it("uuid_generate handler returns a v4 UUID when asked", async () => {
    const tool = findMcpTool("uuid_generate");
    if (!tool) throw new Error("uuid_generate not found");
    const result = await tool.handler({ version: "v4" });
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("base64_encode handler encodes the input", async () => {
    const tool = findMcpTool("base64_encode");
    if (!tool) throw new Error("base64_encode not found");
    const result = await tool.handler({ input: "hello" });
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(text).toBe("aGVsbG8=");
  });

  it("base64_decode handler returns an error-shaped result on invalid input", async () => {
    const tool = findMcpTool("base64_decode");
    if (!tool) throw new Error("base64_decode not found");
    const result = await tool.handler({ input: "!!!not-base64!!!" });
    expect(result.isError).toBe(true);
  });

  it("json_format handler defaults indent to 2", async () => {
    const tool = findMcpTool("json_format");
    if (!tool) throw new Error("json_format not found");
    const result = await tool.handler({ input: '{"a":1}' });
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(text).toContain('  "a": 1');
  });

  it("findMcpTool returns undefined for unknown name", () => {
    expect(findMcpTool("does_not_exist")).toBeUndefined();
  });
});
