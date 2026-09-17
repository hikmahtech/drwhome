import type { CheckResult, DkimCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { dkimRows } from "../../src/reports/dkim";
import { type Row, gradedReport } from "../../src/reports/report";

const report = (result: CheckResult<DkimCheckData>) =>
  gradedReport("dkim", result, "example.com", dkimRows);

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

// A base64 string that decodes to N raw bytes, standing in for a DER-encoded public key.
const keyOfBytes = (n: number) => Buffer.alloc(n, 1).toString("base64");

const found = (selector: string, record: string) => ({
  selector,
  status: "found" as const,
  record,
});

describe("DKIM report", () => {
  it("is good when at least one selector is found", () => {
    const r = report({
      status: "ok",
      data: { selectors: [found("google", "v=DKIM1; k=rsa; p=abc")] },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(r.tone).toBe("good");
  });

  it("shows each found selector with its key type and an approximate RSA size", () => {
    // ~294 raw bytes is what a 2048-bit RSA SubjectPublicKeyInfo decodes to.
    const r = report({
      status: "ok",
      data: {
        selectors: [found("google", `v=DKIM1; k=rsa; p=${keyOfBytes(294)}`)],
      },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "google")?.value).toBe("rsa, ~2048-bit");
  });

  it("recognises ed25519 keys as a fixed 256-bit size", () => {
    const r = report({
      status: "ok",
      data: {
        selectors: [found("mail", `v=DKIM1; k=ed25519; p=${keyOfBytes(32)}`)],
      },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "mail")?.value).toBe("ed25519, 256-bit");
  });

  it("always shows how many selectors were probed", () => {
    const r = report({
      status: "ok",
      data: { selectors: [found("google", "v=DKIM1; k=rsa; p=abc")] },
      fetchedAt: "2026-09-17T00:00:00Z",
    });
    expect(row(r.rows, "Selectors probed")?.value).toBe("22");
  });

  it("grades no selectors found as a low-severity warning, not an absence claim about DKIM", () => {
    const r = report({
      status: "not_applicable",
      reason: "no DKIM record on probed selectors (default, mail, ...)",
    });
    expect(r.tone).toBe("warn");
    expect(r.rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
  });

  it("never grades an error or a timeout", () => {
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
