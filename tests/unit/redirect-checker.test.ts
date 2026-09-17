import type { CheckResult, RedirectsCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { redirectsRows } from "../../src/reports/redirects";
import { gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<RedirectsCheckData>) =>
  gradedReport("redirects", result, "example.com", redirectsRows);

const ok = (hops: RedirectsCheckData["hops"]) =>
  report({
    status: "ok",
    data: { hops, finalStatus: hops[hops.length - 1]?.status ?? 200 },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

describe("Redirect chain report", () => {
  it("is plain info for a direct HTTPS response", () => {
    const r = ok([{ url: "https://example.com/", status: 200 }]);
    expect(r.tone).toBe("good");
    expect(r.rows).toEqual([{ label: "Final", value: "200  https://example.com/" }]);
  });

  it("lists every hop as 'status  url', last one as Final", () => {
    const r = ok([
      { url: "http://example.com/", status: 301 },
      { url: "https://example.com/", status: 200 },
    ]);
    expect(r.rows[0]).toEqual({ label: "Hop 1", value: "301  http://example.com/" });
    expect(r.rows[1]).toEqual({ label: "Final", value: "200  https://example.com/" });
  });

  it("notes an HTTP-to-HTTPS upgrade as informational, not a finding", () => {
    const r = ok([
      { url: "http://example.com/", status: 301 },
      { url: "https://example.com/", status: 200 },
    ]);
    expect(r.tone).toBe("good");
  });

  it("flags a plain-HTTP final destination", () => {
    const r = ok([{ url: "http://example.com/", status: 200 }]);
    expect(r.tone).toBe("bad");
  });

  it("flags a very long redirect chain", () => {
    const hops = Array.from({ length: 6 }, (_, i) => ({
      url: `https://example.com/${i}`,
      status: 301,
    }));
    hops.push({ url: "https://example.com/final", status: 200 });
    const r = ok(hops);
    expect(r.tone).toBe("warn");
  });

  it("grades a cap-exceeded failure but never an error or timeout", () => {
    expect(report({ status: "error", message: "redirect cap exceeded (10)" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
