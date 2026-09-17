import type { CheckResult, DmarcCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { dmarcRows } from "../../src/reports/dmarc";
import { type Row, gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<DmarcCheckData>) =>
  gradedReport("dmarc", result, "example.com", dmarcRows);

function tagsOf(record: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

const ok = (record: string): CheckResult<DmarcCheckData> => ({
  status: "ok",
  data: { record, tags: tagsOf(record) },
  fetchedAt: "2026-09-17T00:00:00Z",
});

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

describe("DMARC report", () => {
  it("takes its verdict from Domain Posture's rule", () => {
    expect(report(ok("v=DMARC1; p=reject")).tone).toBe("good");
    expect(report(ok("v=DMARC1; p=quarantine")).tone).toBe("warn");
    expect(report(ok("v=DMARC1; p=none")).tone).toBe("warn");
  });

  it("shows only the tags present, each with a plain-English note", () => {
    const r = report(ok("v=DMARC1; p=reject; rua=mailto:d@example.com"));
    expect(row(r.rows, "Policy (p)")?.value).toBe("reject");
    expect(row(r.rows, "Policy (p)")?.note).toMatch(/blocked/i);
    expect(row(r.rows, "Aggregate reports (rua)")?.value).toBe("mailto:d@example.com");
    expect(row(r.rows, "Subdomain policy (sp)")).toBeUndefined();
    expect(row(r.rows, "Forensic reports (ruf)")).toBeUndefined();
  });

  it("explains alignment mode", () => {
    const r = report(ok("v=DMARC1; p=reject; adkim=s; aspf=r"));
    expect(row(r.rows, "DKIM alignment (adkim)")?.note).toMatch(/strict/i);
    expect(row(r.rows, "SPF alignment (aspf)")?.note).toMatch(/relaxed/i);
  });

  it("grades a missing DMARC record as bad, with a fix", () => {
    const r = report({ status: "not_applicable", reason: "no DMARC record" });
    expect(r.tone).toBe("bad");
    expect(r.rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
  });

  it("treats two DMARC records as a finding, not as a failed lookup", () => {
    // The check reports this as an error, but it is a fact about the domain: receivers ignore
    // both records. The rule grades it, so the visitor gets the fix, not "could not check".
    const r = report({
      status: "error",
      message: "multiple DMARC records found (2); RFC 7489 forbids this",
    });
    expect(r.tone).toBe("bad");
    expect(r.verdict).not.toContain("Could not check");
  });

  it("never grades a plain failure or a timeout", () => {
    expect(report({ status: "error", message: "upstream 502" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
