import { createHmac, randomBytes, randomUUID } from "node:crypto";

/**
 * Counts MCP use in GA4 through the Measurement Protocol. Two events:
 *
 * - `mcp_session_start` on each `initialize`, with the client's name and version;
 * - `mcp_tool_call` on each tool call, with the tool name, whether it succeeded, and the client.
 *
 * Never the arguments (so never the domain being checked), never an address.
 *
 * The events go to their own GA4 property, set by GA_MCP_MEASUREMENT_ID and GA_MCP_API_SECRET.
 * They must never go to the website's property: each call has no session, so there every call
 * counted as a new user (#11). Without both values nothing is sent. Never throws: analytics must
 * not be able to fail a request.
 */

type Params = Record<string, string | boolean>;

export type McpCaller = {
  /** Pseudonymous id for GA's client_id. Same caller, same UTC day: same id. See callerId. */
  id: string;
  name: string;
  version: string;
};

export function sendMcpEvent(event: string, caller: McpCaller, params: Params = {}): void {
  try {
    const id = process.env.GA_MCP_MEASUREMENT_ID;
    const secret = process.env.GA_MCP_API_SECRET;
    if (!id || !secret) return;
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`;
    void fetch(url, {
      method: "POST",
      body: JSON.stringify({
        client_id: caller.id,
        events: [
          {
            name: event,
            params: {
              ...params,
              client_type: "mcp",
              client_name: caller.name,
              client_version: caller.version,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch {
    // Analytics never fails a request.
  }
}

/** Letters, digits and . _ + - only, lower case, capped. Empty becomes the fallback. */
function clean(raw: string | undefined | null, max: number, fallback: string): string {
  return (
    (raw ?? "")
      .replace(/[^\w.+-]/g, "")
      .slice(0, max)
      .toLowerCase() || fallback
  );
}

/**
 * A coarse name for the caller: the MCP clientInfo.name when the request carries it, otherwise
 * the product token of the User-Agent ("claude-code/1.2 (...)" gives "claude-code"). The endpoint
 * is stateless, so a tools/call request usually has no clientInfo and the User-Agent is what is left.
 */
export function clientLabel(clientInfoName: string | undefined, userAgent: string | null): string {
  return clean(clientInfoName || userAgent?.split(/[\s/]/)[0], 40, "unknown");
}

/**
 * The client's version, from clientInfo.version or the User-Agent's product version
 * ("claude-code/1.2.3 (cli)" gives "1.2.3"). Only taken from the User-Agent when the name was too,
 * so a name and a version always come from the same place.
 */
export function clientVersionLabel(
  clientInfo: { name?: string; version?: string } | undefined,
  userAgent: string | null,
): string {
  const raw = clientInfo?.name ? clientInfo.version : userAgent?.split(/\s/)[0]?.split("/")[1];
  return clean(raw, 24, "unknown");
}

// Used when MCP_CALLER_SALT is not set. It changes at every restart, which only splits a day's
// count for a caller in two; it never makes the id reversible.
const bootSecret = randomBytes(32);

/**
 * A pseudonymous caller id, so GA can count distinct callers per day without ever seeing an
 * address: HMAC-SHA256 of the address under a key that is the server secret (MCP_CALLER_SALT,
 * else a random per-process value) plus the UTC date. The key changes every day, so ids cannot
 * be joined across days, and without the secret an id cannot be tested against a guessed address.
 *
 * The address must be cf-connecting-ip (see clientIp); x-forwarded-for is the proxy's. With no
 * address a fresh random id is used, so such calls count but never merge.
 */
export function callerId(ip: string | null, now: Date = new Date()): string {
  if (!ip) return randomUUID();
  const secret = process.env.MCP_CALLER_SALT || bootSecret;
  const day = now.toISOString().slice(0, 10);
  const key = createHmac("sha256", secret).update(`drwho-mcp-caller:${day}`).digest();
  return createHmac("sha256", key).update(ip).digest("hex").slice(0, 32);
}
