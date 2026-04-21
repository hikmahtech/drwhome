import { describe, expect, it } from "vitest";
import { validateDomain } from "@/lib/dossier/validate-domain";

describe("validateDomain", () => {
  it.each([
    ["example.com"],
    ["sub.example.com"],
    ["xn--bcher-kva.de"],
    ["a-b.c-d.dev"],
  ])("accepts public FQDN %s", (d) => {
    const r = validateDomain(d);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain).toBe(d.toLowerCase());
  });

  it("lowercases mixed-case input", () => {
    const r = validateDomain("Example.COM");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain).toBe("example.com");
  });

  it.each([
    ["", "empty"],
    ["localhost", "localhost banned"],
    ["192.168.1.1", "IP banned"],
    ["10.0.0.1", "IP banned"],
    ["::1", "IPv6 banned"],
    ["example.local", ".local banned"],
    ["example.internal", ".internal banned"],
    ["example.test", ".test banned"],
    ["a-b.c-d.example", "reserved TLD banned"],
    ["example.com:8080", "port banned"],
    ["example.com/path", "path banned"],
    ["example.com?q=1", "query banned"],
    ["user@example.com", "userinfo banned"],
    ["foo", "single label banned"],
    ["foo..bar", "empty label banned"],
    ["-foo.com", "leading hyphen banned"],
    ["foo-.com", "trailing hyphen banned"],
  ])("rejects %s (%s)", (d) => {
    expect(validateDomain(d).ok).toBe(false);
  });
});
