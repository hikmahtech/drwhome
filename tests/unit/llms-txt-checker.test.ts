import type { CheckResult, LlmsTxtCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { llmsTxtRows } from "../../src/reports/llms-txt";
import { gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<LlmsTxtCheckData>) =>
  gradedReport("llms-txt", result, "example.com", llmsTxtRows);

const row = (rows: ReturnType<typeof llmsTxtRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("llms.txt report", () => {
  it("is informational when present", () => {
    const r = report({
      status: "ok",
      data: { bytes: 512, firstLine: "# Example Co" },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("good");
    expect(row(r.rows, "Title")?.value).toBe("Example Co");
    expect(row(r.rows, "Size")?.value).toBe("512 bytes");
  });

  it("never penalises absence — it's an emerging convention, not a control", () => {
    const r = report({ status: "not_applicable", reason: "no llms.txt (http 404)" });
    expect(r.tone).toBe("plain");
    expect(r.verdict).toContain("llms.txt (http 404)");
  });

  it("grades a catch-all HTML page as absent", () => {
    const r = report({
      status: "not_applicable",
      reason: "catch-all HTML response, not an llms.txt",
    });
    expect(r.verdict).toContain("catch-all HTML");
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "network error" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
