import type { CheckResult, TlsCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { gradedReport } from "../../src/reports/report";
import { tlsRows } from "../../src/reports/tls";

const report = (result: CheckResult<TlsCheckData>) =>
  gradedReport("tls", result, "example.com", tlsRows);

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

const ok = (over: Partial<TlsCheckData> = {}) =>
  report({
    status: "ok",
    data: {
      subject: { CN: "example.com", O: "Example Inc" },
      issuer: { CN: "R3", O: "Let's Encrypt" },
      validFrom: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      validTo: inDays(200),
      sans: ["example.com", "www.example.com"],
      fingerprint256: "AA:BB:CC",
      authorized: true,
      ...over,
    },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: ReturnType<typeof tlsRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("TLS certificate report", () => {
  it("is good for a healthy, long-lived certificate", () => {
    const r = ok();
    expect(r.tone).toBe("good");
  });

  it("is bad for an expired certificate", () => {
    const r = ok({ validTo: inDays(-5) });
    expect(r.tone).toBe("bad");
    expect(row(r.rows, "Days remaining")?.value).toContain("expired");
    expect(row(r.rows, "Days remaining")?.tone).toBe("bad");
  });

  it("warns inside 30 days of expiry and flags high severity inside 14", () => {
    const warn = ok({ validTo: inDays(20) });
    expect(warn.tone).toBe("warn");
    expect(row(warn.rows, "Days remaining")?.tone).toBe("warn");

    const bad = ok({ validTo: inDays(10) });
    expect(bad.tone).toBe("bad");
  });

  it("is bad for a self-signed certificate, with a fix row", () => {
    const r = ok({ authorized: false, authorizationError: "DEPTH_ZERO_SELF_SIGNED_CERT" });
    expect(r.tone).toBe("bad");
    expect(r.rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
    expect(row(r.rows, "Chain")?.tone).toBe("bad");
    expect(row(r.rows, "Chain")?.value).toContain("DEPTH_ZERO_SELF_SIGNED_CERT");
  });

  it("shows subject, issuer, SANs and fingerprint", () => {
    const r = ok();
    expect(row(r.rows, "Subject")?.value).toBe("example.com — Example Inc");
    expect(row(r.rows, "Issuer")?.value).toBe("R3 — Let's Encrypt");
    expect(row(r.rows, "Names on the certificate (2)")?.value).toBe("example.com\nwww.example.com");
    expect(row(r.rows, "SHA-256 fingerprint")?.value).toBe("AA:BB:CC");
  });

  it("grades a hostname mismatch but never an error or a timeout", () => {
    const mismatch = ok({ authorized: false, authorizationError: "ERR_TLS_CERT_ALTNAME_INVALID" });
    expect(mismatch.tone).toBe("bad");

    expect(report({ status: "error", message: "connect ECONNREFUSED" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
