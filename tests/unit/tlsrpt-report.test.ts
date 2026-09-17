import type { CheckResult, TlsrptCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { type Row, gradedReport } from "../../src/reports/report";
import { tlsrptRows } from "../../src/reports/tlsrpt";

const report = (result: CheckResult<TlsrptCheckData>) =>
  gradedReport("tlsrpt", result, "example.com", tlsrptRows);

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

describe("TLS-RPT report", () => {
  it("is good with a reporting address configured", () => {
    const r = report({
      status: "ok",
      data: {
        version: "TLSRPTv1",
        ruaUris: ["mailto:tlsrpt@example.com"],
        raw: "v=TLSRPTv1; rua=mailto:tlsrpt@example.com",
      },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Reports go to")?.value).toBe("mailto:tlsrpt@example.com");
    expect(row(r.rows, "Record")?.value).toContain("v=TLSRPTv1");
  });

  it("warns when the record exists but has no rua= address", () => {
    const r = report({
      status: "ok",
      data: { version: "TLSRPTv1", ruaUris: [], raw: "v=TLSRPTv1" },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "Reports go to")?.value).toContain("nowhere");
    expect(r.rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
  });

  it("treats a missing record as informational, not a failure", () => {
    const r = report({ status: "not_applicable", reason: "no TLSRPT record" });
    expect(r.rows).toEqual([]);
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
