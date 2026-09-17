import type { CheckResult, CorsCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { corsRows } from "../../src/reports/cors";
import { gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<CorsCheckData>) =>
  gradedReport("cors", result, "example.com", corsRows);

const ok = (over: Partial<CorsCheckData>) =>
  report({
    status: "ok",
    data: {
      origin: "https://domainposture.com",
      method: "GET",
      preflightStatus: 204,
      anyAcHeader: false,
      ...over,
    },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: ReturnType<typeof corsRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("CORS report", () => {
  it("is informational when no CORS headers are sent", () => {
    const r = ok({});
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Access-Control-Allow-Origin")?.value).toBe("not sent");
  });

  it("warns on a wildcard origin", () => {
    const r = ok({ allowOrigin: "*", anyAcHeader: true });
    expect(r.tone).toBe("warn");
  });

  it("flags wildcard-plus-credentials as high severity with an explanatory note", () => {
    const r = ok({ allowOrigin: "*", allowCredentials: "true", anyAcHeader: true });
    expect(r.tone).toBe("bad");
    const note = row(r.rows, "Note");
    expect(note?.tone).toBe("bad");
    expect(note?.note).toContain("Browsers refuse");
  });

  it("is informational for a specific allowed origin", () => {
    const r = ok({ allowOrigin: "https://app.example.com", anyAcHeader: true });
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Access-Control-Allow-Origin")?.value).toBe("https://app.example.com");
  });

  it("lists every access-control-* header that came back", () => {
    const r = ok({
      allowOrigin: "*",
      allowMethods: "GET, POST",
      allowHeaders: "Content-Type",
      maxAge: "600",
      exposeHeaders: "X-Total-Count",
      anyAcHeader: true,
    });
    expect(row(r.rows, "Access-Control-Allow-Methods")?.value).toBe("GET, POST");
    expect(row(r.rows, "Access-Control-Allow-Headers")?.value).toBe("Content-Type");
    expect(row(r.rows, "Access-Control-Max-Age")?.value).toBe("600");
    expect(row(r.rows, "Access-Control-Expose-Headers")?.value).toBe("X-Total-Count");
  });

  it("grades a fetch failure but never an error or timeout", () => {
    expect(report({ status: "error", message: "network error" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
