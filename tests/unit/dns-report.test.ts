import type { CheckResult, DnsCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { dnsRows } from "../../src/reports/dns";
import { type Row, gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<DnsCheckData>) =>
  gradedReport("dns", result, "example.com", dnsRows);

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);
const answer = (data: string) => ({ name: "example.com", type: 1, TTL: 300, data });

const ok = (records: Partial<DnsCheckData["records"]>): CheckResult<DnsCheckData> => ({
  status: "ok",
  data: {
    records: { A: [], AAAA: [], NS: [], SOA: [], CAA: [], TXT: [], ...records },
  },
  fetchedAt: "2026-09-17T00:00:00Z",
});

describe("DNS records report", () => {
  it("shows one row per record type present, values joined by newlines", () => {
    const r = report(
      ok({
        A: [answer("1.2.3.4"), answer("5.6.7.8")],
        NS: [answer("ns1.example.com")],
      }),
    );
    expect(row(r.rows, "A")?.value).toBe("1.2.3.4\n5.6.7.8");
    expect(row(r.rows, "NS")?.value).toBe("ns1.example.com");
  });

  it("leaves out record types with no answers", () => {
    const r = report(ok({ A: [answer("1.2.3.4")] }));
    expect(row(r.rows, "AAAA")).toBeUndefined();
    expect(row(r.rows, "TXT")).toBeUndefined();
  });

  it("unquotes TXT values", () => {
    const r = report(ok({ TXT: [answer('"v=spf1 -all"')] }));
    expect(row(r.rows, "TXT")?.value).toBe("v=spf1 -all");
  });

  it("grades no A/AAAA on the apex as critical", () => {
    const r = report(ok({ NS: [answer("ns1.example.com")] }));
    expect(r.tone).toBe("bad");
  });

  it("grades no DNS records at all as not applicable", () => {
    const r = report({ status: "not_applicable", reason: "no DNS records found" });
    expect(r.rows).toEqual([]);
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
