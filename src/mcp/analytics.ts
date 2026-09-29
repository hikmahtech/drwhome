import { randomUUID } from "node:crypto";

/**
 * Counts MCP tool calls in GA4 through the Measurement Protocol. Sends the tool name, whether it
 * succeeded and a coarse client label. Never the arguments, never an address.
 *
 * The calls go to their own GA4 property, set by GA_MCP_MEASUREMENT_ID and GA_MCP_API_SECRET.
 * They must never go to the website's property: each call has no session, so there every call
 * counted as a new user (#11). Without both values nothing is sent. Never throws: analytics must
 * not be able to fail a tool call.
 */
export function sendMcpEvent(tool: string, success: boolean, client = "unknown"): void {
  const id = process.env.GA_MCP_MEASUREMENT_ID;
  const secret = process.env.GA_MCP_API_SECRET;
  if (!id || !secret) return;
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${id}&api_secret=${secret}`;
  void fetch(url, {
    method: "POST",
    body: JSON.stringify({
      // A fresh id per call: calls can be counted, callers cannot be followed.
      client_id: randomUUID(),
      events: [
        {
          name: "mcp_tool_call",
          params: { tool_name: tool, success, client_type: "mcp", client_name: client },
        },
      ],
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});
}

/**
 * A coarse name for the caller: the MCP clientInfo.name when the request carries it, otherwise
 * the product token of the User-Agent ("claude-code/1.2 (...)" gives "claude-code"). The endpoint
 * is stateless, so a tools/call request usually has no clientInfo and the User-Agent is what is left.
 */
export function clientLabel(clientInfoName: string | undefined, userAgent: string | null): string {
  const raw = clientInfoName || userAgent?.split(/[\s/]/)[0] || "";
  return (
    raw
      .replace(/[^\w.-]/g, "")
      .slice(0, 40)
      .toLowerCase() || "unknown"
  );
}
