import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { clientIp } from "../server/client-ip";
import { createLimiter } from "../server/rate-limit";
import { sendMcpEvent } from "./analytics";
import { createMcpServer } from "./server";

/**
 * The public MCP endpoint: POST /mcp/mcp, streamable HTTP, no key and no account.
 *
 * Stateless: every request gets a fresh server and transport, so nothing is kept between calls
 * and one replica's restart loses nothing. Directory health checks (Glama, the MCP registry)
 * do a plain initialize + tools/list here, so neither may ever redirect or ask for auth.
 */
const HOUR = 60 * 60 * 1000;
const callLimiter = createLimiter({ perWindow: 60, windowMs: HOUR, anonymousPerWindow: 60 });

export const mcp = new Hono();

// No server-initiated messages exist, so there is no stream to open: GET is refused at once
// instead of hanging on an event stream. Hono routes HEAD to this handler too, and HEAD gets a
// plain 200, because uptime monitors and link-preview bots probe with it.
mcp.get("/mcp/mcp", (c) => {
  if (c.req.raw.method === "HEAD") return c.body(null, 200);
  c.header("allow", "POST");
  return c.json({ jsonrpc: "2.0", error: { code: -32000, message: "Use POST." }, id: null }, 405);
});
mcp.delete("/mcp/mcp", (c) => c.body(null, 405));

mcp.post("/mcp/mcp", async (c) => {
  const ip = clientIp(c.req.raw.headers);
  const server = createMcpServer((tool) => async (input) => {
    // Only tool calls are metered. Listing the tools is always free.
    const limit = callLimiter.take(ip);
    if (!limit.ok) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Rate limit reached: 60 tool calls per hour per address. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
          },
        ],
      };
    }
    const result = await tool.handler(input);
    sendMcpEvent(tool.name, !result.isError);
    return result;
  });
  const transport = new StreamableHTTPTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  const res = await transport.handleRequest(c);
  return res ?? c.body(null, 202);
});
