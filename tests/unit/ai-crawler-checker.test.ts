import type { AiCrawlerPolicyData, CheckResult } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { aiCrawlerRows } from "../../src/reports/ai-crawlers";
import { gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<AiCrawlerPolicyData>) =>
  gradedReport("ai-crawlers", result, "example.com", aiCrawlerRows);

const unspecified = () =>
  Object.fromEntries(
    ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "CCBot", "meta-externalagent"].map(
      (a) => [a, "unspecified" as const],
    ),
  );

type Stance = "allowed" | "blocked" | "unspecified";

const ok = (agents: Record<string, Stance> = {}, hasRobots = true) =>
  report({
    status: "ok",
    data: { hasRobots, agents: { ...unspecified(), ...agents } },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: ReturnType<typeof aiCrawlerRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("AI crawler policy report", () => {
  it("is always informational — a stance, not a vulnerability", () => {
    expect(ok().tone).toBe("good");
    expect(ok({ GPTBot: "blocked" }).tone).toBe("good");
  });

  it("lists all six crawlers with their stance", () => {
    const r = ok({ GPTBot: "blocked", ClaudeBot: "allowed" });
    expect(row(r.rows, "GPTBot")?.value).toBe("blocked");
    expect(row(r.rows, "GPTBot")?.tone).toBe("warn");
    expect(row(r.rows, "ClaudeBot")?.value).toBe("allowed");
    expect(row(r.rows, "ClaudeBot")?.tone).toBe("good");
    expect(row(r.rows, "CCBot")?.value).toBe("unspecified");
    expect(row(r.rows, "CCBot")?.tone).toBe("plain");
  });

  it("shows whether robots.txt exists at all", () => {
    expect(row(ok({}, false).rows, "robots.txt")?.value).toBe("not found");
    expect(row(ok({}, true).rows, "robots.txt")?.value).toBe("present");
  });

  it("grades a fetch failure but never an error or timeout", () => {
    expect(report({ status: "error", message: "network error" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
