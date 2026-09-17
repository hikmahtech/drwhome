import type { CheckResult, MxCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { mxRows } from "../../src/reports/mx";
import { type Row, gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<MxCheckData>) =>
  gradedReport("mx", result, "example.com", mxRows);

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

describe("MX report", () => {
  it("lists mail servers as one row, priority then exchange per line", () => {
    const r = report({
      status: "ok",
      data: {
        records: [
          { priority: 10, exchange: "mail1.example.com" },
          { priority: 20, exchange: "mail2.example.com" },
        ],
      },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "Mail servers (2)")?.value).toBe(
      "10 mail1.example.com\n20 mail2.example.com",
    );
  });

  it("grades no MX records on the apex as bad — mail cannot be delivered", () => {
    const r = report({ status: "not_applicable", reason: "no MX records" });
    expect(r.tone).toBe("bad");
    expect(r.rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
  });

  it("warns about a single MX pointing at the apex — no redundancy", () => {
    const r = report({
      status: "ok",
      data: { records: [{ priority: 10, exchange: "example.com" }] },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("warn");
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
