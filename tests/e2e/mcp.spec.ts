import { expect, test } from "@playwright/test";

const MCP_URL = "/mcp/mcp";
const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
};

function parseMaybeSse(raw: string): unknown {
  // mcp-handler may respond with an SSE frame like "event: message\ndata: {...}\n\n"
  // Pull out the first JSON object either way.
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const match = trimmed.match(/data:\s*(\{[\s\S]*?\})\s*$/m);
  if (!match) throw new Error(`unparseable MCP body: ${raw.slice(0, 120)}`);
  return JSON.parse(match[1]);
}

test("MCP initialize returns server capabilities", async ({ request }) => {
  const res = await request.post(MCP_URL, {
    headers: HEADERS,
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "playwright", version: "0" },
      },
    },
  });
  expect(res.status()).toBe(200);
  const body = parseMaybeSse(await res.text()) as {
    result: { serverInfo: { name: string }; capabilities: { tools?: unknown } };
  };
  expect(body.result.serverInfo.name).toBe("drwho.me");
  expect(body.result.capabilities.tools).toBeDefined();
});

test("MCP tools/list advertises every MCP-compatible tool", async ({ request }) => {
  const res = await request.post(MCP_URL, {
    headers: HEADERS,
    data: { jsonrpc: "2.0", id: 2, method: "tools/list" },
  });
  expect(res.status()).toBe(200);
  const body = parseMaybeSse(await res.text()) as {
    result: { tools: { name: string }[] };
  };
  const names = body.result.tools.map((t) => t.name).sort();
  expect(names).toEqual(
    [
      "base64_decode",
      "base64_encode",
      "dns_lookup",
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

test("MCP tools/call returns 402 + -32001 paywall", async ({ request }) => {
  const res = await request.post(MCP_URL, {
    headers: HEADERS,
    data: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "uuid_generate", arguments: { version: "v4" } },
    },
  });
  expect(res.status()).toBe(402);
  const body = (await res.json()) as {
    error: { code: number; message: string; data: { upgradeUrl: string; tier: string } };
  };
  expect(body.error.code).toBe(-32001);
  expect(body.error.message).toMatch(/subscription/i);
  expect(body.error.data.upgradeUrl).toBe("https://drwho.me/mcp");
  expect(body.error.data.tier).toBe("paid");
});

test("MCP tools/call paywalls every MCP-compatible tool (quick spot check)", async ({
  request,
}) => {
  for (const name of ["jwt_decode", "base64_encode", "dns_lookup"]) {
    const res = await request.post(MCP_URL, {
      headers: HEADERS,
      data: {
        jsonrpc: "2.0",
        id: 10,
        method: "tools/call",
        params: { name, arguments: {} },
      },
    });
    expect(res.status(), `expected 402 for ${name}`).toBe(402);
  }
});
