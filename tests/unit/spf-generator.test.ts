import { describe, expect, it } from "vitest";
import { buildSpfRecord } from "../../src/lib/spf-generator";

describe("buildSpfRecord", () => {
  it("builds v=spf1 with a, mx, ip4, include and the all mechanism", () => {
    const { record, lookups } = buildSpfRecord({
      a: true,
      mx: true,
      ip4: ["192.0.2.0/24"],
      includes: ["_spf.google.com", "include:sendgrid.net"],
      all: "~all",
    });
    expect(record).toBe(
      "v=spf1 a mx ip4:192.0.2.0/24 include:_spf.google.com include:sendgrid.net ~all",
    );
    expect(lookups).toBe(4); // a + mx + 2 includes
  });

  it("warns on +all and ?all", () => {
    expect(buildSpfRecord({ all: "+all" }).warnings.some((w) => /defeats SPF/i.test(w))).toBe(true);
    expect(buildSpfRecord({ all: "?all" }).warnings.some((w) => /neutral/i.test(w))).toBe(true);
  });

  it("warns when the 10-DNS-lookup limit is exceeded", () => {
    const includes = Array.from({ length: 11 }, (_, i) => `_spf${i}.example.com`);
    const { warnings, lookups } = buildSpfRecord({ includes, all: "-all" });
    expect(lookups).toBe(11);
    expect(warnings.some((w) => /at most 10/i.test(w))).toBe(true);
  });

  it("ignores invalid IPs with a warning", () => {
    const { record, warnings } = buildSpfRecord({ ip4: ["999.1.1.1"], all: "-all" });
    expect(record).toBe("v=spf1 -all");
    expect(warnings.some((w) => /invalid IPv4/i.test(w))).toBe(true);
  });

  it("accepts a valid IPv6 CIDR", () => {
    const { record, warnings } = buildSpfRecord({ ip6: ["2001:db8::/32"], all: "-all" });
    expect(record).toBe("v=spf1 ip6:2001:db8::/32 -all");
    expect(warnings).toEqual([]);
  });
});
