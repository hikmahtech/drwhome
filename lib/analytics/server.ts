import { randomUUID } from "node:crypto";

const GA_MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export type McpEvent = {
  name: string;
  success: boolean;
};

export async function sendMcpEvent(event: McpEvent): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const url = `${GA_MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const body = JSON.stringify({
    client_id: randomUUID(),
    events: [
      {
        name: "mcp_tool_call",
        params: {
          tool_name: event.name,
          success: event.success,
          client_type: "mcp",
        },
      },
    ],
  });

  try {
    await fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Fire-and-forget: never let GA failures propagate into MCP responses.
  }
}
