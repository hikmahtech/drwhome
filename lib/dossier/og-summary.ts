import type { CheckResult } from "@/lib/dossier/types";

export type OgBadgeState = "pass" | "fail" | "na" | "pending";

export type OgBadge = { state: OgBadgeState };

export type OgSummary = {
  total: number;
  passed: number;
  badges: OgBadge[];
};

export function summarizeForOg(results: Array<CheckResult<unknown> | null>): OgSummary {
  const badges: OgBadge[] = results.map((r) => {
    if (r === null) return { state: "pending" };
    if (r.status === "ok") return { state: "pass" };
    if (r.status === "not_applicable") return { state: "na" };
    return { state: "fail" };
  });
  const passed = badges.filter((b) => b.state === "pass").length;
  return { total: results.length, passed, badges };
}
