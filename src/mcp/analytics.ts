import { randomUUID } from "node:crypto";

/**
 * Counts MCP tool calls in GA4 through the Measurement Protocol. Sends the tool name and whether
 * it succeeded. Never the arguments. Does nothing unless both values are configured, and never
 * throws: analytics must not be able to fail a tool call.
 */
export function sendMcpEvent(tool: string, success: boolean): void {
  const id = process.env.GA_MEASUREMENT_ID;
  const secret = process.env.GA_API_SECRET;
  if (!id || !secret) return;
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${id}&api_secret=${secret}`;
  void fetch(url, {
    method: "POST",
    body: JSON.stringify({
      // A fresh id per call: calls can be counted, callers cannot be followed.
      client_id: randomUUID(),
      events: [{ name: "mcp_tool_call", params: { tool_name: tool, success, client_type: "mcp" } }],
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});
}
