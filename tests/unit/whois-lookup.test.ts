import type { CheckResult, WhoisCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { gradedReport } from "../../src/reports/report";
import { whoisRows } from "../../src/reports/whois";

const report = (result: CheckResult<WhoisCheckData>) =>
  gradedReport("whois", result, "example.com", whoisRows);

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

const ok = (over: Partial<WhoisCheckData> = {}) =>
  report({
    status: "ok",
    data: {
      registrar: "Example Registrar LLC",
      createdAt: "2010-01-01T00:00:00Z",
      expiresAt: inDays(200),
      statuses: ["clientTransferProhibited"],
      raw: {},
      ...over,
    },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: ReturnType<typeof whoisRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("WHOIS report", () => {
  it("is informational for a domain registered well into the future", () => {
    const r = ok();
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Registrar")?.value).toBe("Example Registrar LLC");
    expect(row(r.rows, "Created")?.value).toBe("2010-01-01T00:00:00Z");
  });

  it("is critical for an expired registration", () => {
    const r = ok({ expiresAt: inDays(-5) });
    expect(r.tone).toBe("bad");
    expect(row(r.rows, "Expires")?.tone).toBe("bad");
  });

  it("warns inside 30 days of expiry", () => {
    const r = ok({ expiresAt: inDays(20) });
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "Expires")?.tone).toBe("warn");
  });

  it("labels the data source WHOIS by default and RDAP when the check fell back", () => {
    expect(row(ok().rows, "Source")?.value).toBe("WHOIS");
    expect(row(ok({ raw: { source: "rdap" } }).rows, "Source")?.value).toBe("RDAP");
  });

  it("lists statuses", () => {
    const r = ok({ statuses: ["clientTransferProhibited", "clientUpdateProhibited"] });
    expect(row(r.rows, "Status (2)")?.value).toBe(
      "clientTransferProhibited\nclientUpdateProhibited",
    );
  });

  it("never grades a WHOIS-and-RDAP failure as expired", () => {
    const r = report({
      status: "not_applicable",
      reason:
        "whois returned no data and RDAP fallback unavailable (registry refused or unmapped TLD)",
    });
    expect(r.tone).toBe("plain");
    expect(r.rows).toEqual([]);
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "whois failed" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
