import type { CheckResult } from "@/lib/dossier/types";
import { summarizeForOg } from "@/lib/dossier/og-summary";
import { describe, expect, it } from "vitest";

function ok<T>(data: T): CheckResult<T> {
  return { status: "ok", data, fetchedAt: "2026-04-24T00:00:00Z" };
}

describe("summarizeForOg", () => {
  it("counts only ok results as passed", () => {
    const results = [
      ok({}),
      ok({}),
      { status: "error", message: "boom" } as CheckResult<unknown>,
      { status: "timeout", ms: 4000 } as CheckResult<unknown>,
      { status: "not_applicable", reason: "n/a" } as CheckResult<unknown>,
      null,
    ];
    const s = summarizeForOg(results);
    expect(s.passed).toBe(2);
    expect(s.total).toBe(6);
  });

  it("maps null to pending badge", () => {
    const s = summarizeForOg([null, null]);
    expect(s.badges).toEqual([
      { state: "pending" },
      { state: "pending" },
    ]);
  });

  it("maps ok to pass and error/timeout to fail", () => {
    const s = summarizeForOg([
      ok({}),
      { status: "error", message: "x" } as CheckResult<unknown>,
      { status: "timeout", ms: 4000 } as CheckResult<unknown>,
      { status: "not_applicable", reason: "x" } as CheckResult<unknown>,
    ]);
    expect(s.badges.map((b) => b.state)).toEqual(["pass", "fail", "fail", "na"]);
  });
});
