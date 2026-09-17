import type { CheckResult, McpEndpointCheckData } from "@hikmahtech/dossier-checks";
import { type Report, reportFailure } from "./report";

/**
 * mcpEndpointCheck has no Domain Posture rule (it is not part of the shared free-dossier rule
 * set), so this report is built by hand instead of through gradedReport. It never claims a
 * domain is secure or insecure — it only says what answered at the probed URL.
 */
export function mcpEndpointReport(
  result: CheckResult<McpEndpointCheckData>,
  probedUrl: string,
): Report {
  if (result.status !== "ok") return reportFailure(result);
  const d = result.data;

  const rows: Report["rows"] = [
    { label: "Probed", value: probedUrl },
    { label: "HTTPS", value: d.https ? "yes" : "no", tone: d.https ? "good" : "warn" },
    { label: "HTTP status", value: String(d.httpStatus) },
    {
      label: "Needs auth",
      value: d.authRequired ? "yes — answered 401/403" : "no",
      tone: d.authRequired ? "good" : "plain",
    },
    {
      label: "OAuth discovery",
      value: d.oauthProtectedResource
        ? "published (RFC 9728 protected-resource metadata)"
        : "not published",
      tone: d.oauthProtectedResource ? "good" : "plain",
    },
  ];

  if (d.httpStatus === 404) {
    return {
      verdict: "No MCP endpoint found at that path.",
      tone: "warn",
      rows,
    };
  }
  if (d.authRequired) {
    return {
      verdict: "Something answered at that path and requires authentication.",
      tone: "good",
      rows,
    };
  }
  if (d.httpStatus >= 200 && d.httpStatus < 300) {
    return {
      verdict: d.https
        ? "Something answered at that path over HTTPS, with no auth required."
        : "Something answered at that path, with no auth required, and it is not HTTPS.",
      tone: d.https ? "warn" : "bad",
      rows,
    };
  }
  return {
    verdict: `Got HTTP ${d.httpStatus} at that path — this does not confirm an MCP endpoint is there.`,
    tone: "plain",
    rows,
  };
}
