import type { CheckResult, McpEndpointCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { mcpEndpointReport } from "../../src/reports/mcp-endpoint";

const URL = "https://example.com/mcp";

const ok = (data: McpEndpointCheckData) =>
  mcpEndpointReport({ status: "ok", data, fetchedAt: "2026-09-17T00:00:00Z" }, URL);

const row = (rows: ReturnType<typeof ok>["rows"], label: string) =>
  rows.find((x) => x.label === label);

describe("MCP endpoint report", () => {
  it("reports a 404 as no endpoint found, and warns", () => {
    const r = ok({
      https: true,
      httpStatus: 404,
      authRequired: false,
      oauthProtectedResource: false,
    });
    expect(r.tone).toBe("warn");
    expect(r.verdict).toContain("No MCP endpoint found");
  });

  it("treats a 401/403 as good — the expected shape for a real server", () => {
    const r = ok({
      https: true,
      httpStatus: 401,
      authRequired: true,
      oauthProtectedResource: true,
    });
    expect(r.tone).toBe("good");
    expect(r.verdict).toContain("requires authentication");
    expect(row(r.rows, "OAuth discovery")?.value).toContain("published");
  });

  it("warns on a 200 over HTTPS with no auth required", () => {
    const r = ok({
      https: true,
      httpStatus: 200,
      authRequired: false,
      oauthProtectedResource: false,
    });
    expect(r.tone).toBe("warn");
  });

  it("is bad for a 200 with no auth over plain HTTP", () => {
    const r = ok({
      https: false,
      httpStatus: 200,
      authRequired: false,
      oauthProtectedResource: false,
    });
    expect(r.tone).toBe("bad");
  });

  it("is plain for an inconclusive status like 500", () => {
    const r = ok({
      https: true,
      httpStatus: 500,
      authRequired: false,
      oauthProtectedResource: false,
    });
    expect(r.tone).toBe("plain");
    expect(r.verdict).toContain("HTTP 500");
  });

  it("always shows the probed URL", () => {
    const r = ok({
      https: true,
      httpStatus: 404,
      authRequired: false,
      oauthProtectedResource: false,
    });
    expect(row(r.rows, "Probed")?.value).toBe(URL);
  });

  it("falls back to reportFailure for a timeout or an error", () => {
    expect(mcpEndpointReport({ status: "timeout", ms: 10_000 }, URL).verdict).toContain(
      "10 seconds",
    );
    expect(mcpEndpointReport({ status: "error", message: "network error" }, URL).verdict).toContain(
      "Could not check",
    );
  });
});
