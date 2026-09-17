import {
  type CheckResult,
  type Grade,
  type RuleSlug,
  gradeFinding,
} from "@hikmahtech/dossier-checks";

/**
 * A result is shown as a report: a verdict line, then rows of label / value / note.
 * Rows are plain data, so the browser, the server and the MCP server all build the same
 * report from one function.
 */
export type Tone = "good" | "warn" | "bad" | "plain";
export type Row = { label: string; value: string; note?: string; tone?: Tone };
export type Report = { verdict: string; tone: Tone; rows: Row[] };

const upperFirst = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Wording for the states where there is nothing to grade. */
export function reportFailure<T>(r: Exclude<CheckResult<T>, { status: "ok" }>): Report {
  if (r.status === "timeout") {
    return {
      verdict: `No answer within ${r.ms / 1000} seconds. Try again.`,
      tone: "warn",
      rows: [],
    };
  }
  // not_applicable = we looked and it is absent. error = we could not tell. Never merge them.
  if (r.status === "not_applicable")
    return { verdict: upperFirst(r.reason), tone: "warn", rows: [] };
  return { verdict: `Could not check: ${r.message}`, tone: "bad", rows: [] };
}

function toneOf(grade: Grade, ok: boolean): Tone {
  if (grade.severity === "high" || grade.severity === "critical") return "bad";
  if (grade.severity === "medium" || grade.severity === "low") return "warn";
  return ok ? "good" : "plain";
}

/**
 * Report for a check that Domain Posture's rules engine can grade. The verdict comes from the
 * same rule Domain Posture uses, so the two sites never disagree about a domain.
 */
export function gradedReport<T>(
  rule: RuleSlug,
  result: CheckResult<T>,
  domain: string,
  rows: (data: T) => Row[],
): Report {
  // A timeout says nothing about the domain, so it is never graded.
  if (result.status === "timeout") return reportFailure(result);

  // Every scanned name is treated as the apex, as Domain Posture does.
  const grade = gradeFinding(rule, result as CheckResult<unknown>, { isApex: true, host: domain });

  // Most errors mean "we could not tell". A few are findings in their own right (two SPF or
  // two DMARC records make the check error, and that IS the problem). The rule tells them
  // apart: it grades a real finding above "info" and leaves a plain failure at "info".
  if (result.status === "error" && grade.severity === "info") return reportFailure(result);
  const ok = result.status === "ok";
  const fixes: Row[] = (grade.recommendations ?? []).map((value, i, all) => ({
    label: all.length > 1 ? `To fix ${i + 1}` : "To fix",
    value,
  }));
  return {
    verdict: upperFirst(grade.reason),
    tone: toneOf(grade, ok),
    rows: [...(ok ? rows(result.data) : []), ...fixes],
  };
}
