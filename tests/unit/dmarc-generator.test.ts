import { describe, expect, it } from "vitest";
import { buildDmarcRecord } from "../../src/lib/dmarc-generator";

describe("buildDmarcRecord", () => {
  it("always starts v=DMARC1; p=... and warns p=none is monitoring only", () => {
    const { record, warnings } = buildDmarcRecord({ policy: "none" });
    expect(record.startsWith("v=DMARC1; p=none")).toBe(true);
    expect(warnings.some((w) => /monitoring only/i.test(w))).toBe(true);
    expect(warnings.some((w) => /no rua/i.test(w))).toBe(true);
  });

  it("builds a full record with rua, sp, alignment and pct", () => {
    const { record } = buildDmarcRecord({
      policy: "quarantine",
      subdomainPolicy: "reject",
      rua: "dmarc@example.com, mailto:reports@example.com",
      pct: 50,
      adkim: "s",
      aspf: "s",
    });
    expect(record).toContain("p=quarantine");
    expect(record).toContain("sp=reject");
    expect(record).toContain("rua=mailto:dmarc@example.com,mailto:reports@example.com");
    expect(record).toContain("pct=50");
    expect(record).toContain("adkim=s");
    expect(record).toContain("aspf=s");
  });

  it("omits pct when 100 and ignores invalid report addresses", () => {
    const { record, warnings } = buildDmarcRecord({
      policy: "reject",
      rua: "good@example.com, not-an-email",
      pct: 100,
    });
    expect(record).not.toContain("pct=");
    expect(record).toContain("rua=mailto:good@example.com");
    expect(warnings.some((w) => /invalid report address: not-an-email/i.test(w))).toBe(true);
    expect(warnings.some((w) => /p=reject drops/i.test(w))).toBe(true);
  });
});
