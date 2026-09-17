import type { CheckResult, DnssecCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { dnssecRows } from "../../src/reports/dnssec";
import { type Row, gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<DnssecCheckData>) =>
  gradedReport("dnssec", result, "example.com", dnssecRows);

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);
const answer = (data: string) => ({ name: "example.com", type: 48, TTL: 300, data });

describe("DNSSEC report", () => {
  it("is good when the chain validates", () => {
    const r = report({
      status: "ok",
      data: { dnssecEnabled: true, adFlag: true, ds: [answer("DS")], dnskey: [answer("DNSKEY")] },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("good");
    expect(row(r.rows, "DNSSEC")?.value).toBe("Enabled");
    expect(row(r.rows, "DS (1)")?.value).toBe("DS");
  });

  it("flags a DS record present but not validated as worse than plain absence", () => {
    const r = report({
      status: "ok",
      data: { dnssecEnabled: false, adFlag: false, ds: [answer("DS")], dnskey: [] },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "DNSSEC")?.value).toBe("Not enabled");
  });

  it("shows nothing configured as a low-severity, not a failure", () => {
    const r = report({
      status: "ok",
      data: { dnssecEnabled: false, adFlag: false, ds: [], dnskey: [] },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "DS (0)")).toBeUndefined();
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
