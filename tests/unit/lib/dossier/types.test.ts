import { type CheckResult, isError, isOk } from "@/lib/dossier/types";
import { describe, expect, it } from "vitest";

describe("CheckResult narrowing", () => {
  it("isOk narrows to the ok variant and exposes data", () => {
    const r: CheckResult<number> = { status: "ok", data: 42, fetchedAt: "2026-04-21T00:00:00Z" };
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data).toBe(42);
    }
  });

  it("isError returns true for the error variant", () => {
    const r: CheckResult<number> = { status: "error", message: "boom" };
    expect(isError(r)).toBe(true);
  });

  it("isOk returns false for timeout, not_applicable, and error", () => {
    const ts: CheckResult<number>[] = [
      { status: "timeout", ms: 5000 },
      { status: "not_applicable", reason: "no record" },
      { status: "error", message: "boom" },
    ];
    for (const r of ts) expect(isOk(r)).toBe(false);
  });
});
