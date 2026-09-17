import type { CheckResult, CtLogCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { ctLogRows } from "../../src/reports/ct-log";
import { type Row, gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<CtLogCheckData>) =>
  gradedReport("ct_log", result, "example.com", ctLogRows);

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

describe("CT log report", () => {
  it("lists the subdomain count and the list itself in one row", () => {
    const r = report({
      status: "ok",
      data: {
        subdomains: ["a.example.com", "b.example.com"],
        wildcards: [],
        certCount: 5,
        source: "crt.sh",
      },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "Subdomains (2)")?.value).toBe("a.example.com\nb.example.com");
    expect(row(r.rows, "Certificates seen")?.value).toBe("5");
  });

  it("notes the cap when 100 or more subdomains are found", () => {
    const many = Array.from({ length: 100 }, (_, i) => `s${i}.example.com`);
    const r = report({
      status: "ok",
      data: { subdomains: many, wildcards: [], certCount: 200, source: "crt.sh" },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "Subdomains (100+)")?.note).toMatch(/capped/i);
  });

  it("shows wildcard certificates separately from named subdomains", () => {
    const r = report({
      status: "ok",
      data: { subdomains: [], wildcards: ["*.example.com"], certCount: 1, source: "crt.sh" },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "Wildcard certificates (1)")?.value).toBe("*.example.com");
  });

  it("treats zero results as a low-severity finding, not an error", () => {
    const r = report({
      status: "ok",
      data: { subdomains: [], wildcards: [], certCount: 0, source: "crt.sh" },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("warn");
    expect(row(r.rows, "Subdomains (0)")?.value).toBe("none found");
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 10000 }).verdict).toContain("10 seconds");
  });
});
