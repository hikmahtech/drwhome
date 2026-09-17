import type { CheckResult, MtaStsCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { mtaStsRows } from "../../src/reports/mta-sts";
import { gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<MtaStsCheckData>) =>
  gradedReport("mta_sts", result, "example.com", mtaStsRows);

const ok = (mode: MtaStsCheckData["mode"]) =>
  report({
    status: "ok",
    data: { policyId: "abc123", mode, mx: ["mail.example.com"], maxAge: 604800, raw: "" },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: ReturnType<typeof mtaStsRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("MTA-STS report", () => {
  it("is good in enforce mode", () => {
    const r = ok("enforce");
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Mode")?.tone).toBe("good");
  });

  it("warns in testing mode", () => {
    const r = ok("testing");
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "Mode")?.tone).toBe("warn");
  });

  it("is a medium-severity finding in none mode", () => {
    const r = ok("none");
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "Mode")?.tone).toBe("bad");
  });

  it("lists the allowed MX servers", () => {
    const r = ok("enforce");
    expect(row(r.rows, "MX allowed (1)")?.value).toBe("mail.example.com");
    expect(row(r.rows, "Max age")?.value).toBe("604800 seconds");
  });

  it("treats no _mta-sts record as absence, not an error", () => {
    const r = report({ status: "not_applicable", reason: "no _mta-sts TXT record" });
    expect(r.tone).toBe("plain");
    expect(r.verdict).toContain("_mta-sts TXT record");
  });

  it("never grades a network error or timeout", () => {
    expect(report({ status: "error", message: "mta-sts TXT lookup: timeout" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
