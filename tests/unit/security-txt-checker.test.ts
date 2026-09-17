import type { CheckResult, SecurityTxtCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { gradedReport } from "../../src/reports/report";
import { securityTxtRows } from "../../src/reports/security-txt";

const report = (result: CheckResult<SecurityTxtCheckData>) =>
  gradedReport("security-txt", result, "example.com", securityTxtRows);

const row = (rows: ReturnType<typeof securityTxtRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("security.txt report", () => {
  it("is informational when present", () => {
    const r = report({
      status: "ok",
      data: { contact: ["mailto:security@example.com"], expires: "2027-01-01T00:00:00Z", raw: "" },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Contact (1)")?.value).toBe("mailto:security@example.com");
    expect(row(r.rows, "Expires")?.value).toBe("2027-01-01T00:00:00Z");
  });

  it("is a low-severity finding when absent, with a recommendation", () => {
    const r = report({ status: "not_applicable", reason: "no security.txt (http 404)" });
    expect(r.tone).toBe("warn");
    expect(r.rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
  });

  it("never grades an error or a timeout as absence", () => {
    expect(report({ status: "error", message: "network error" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
