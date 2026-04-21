import { extractClientIp } from "@/lib/rate-limit/client-ip";
import { describe, expect, it } from "vitest";

function h(pairs: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [k, v] of Object.entries(pairs)) headers.set(k, v);
  return headers;
}

describe("extractClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "   203.0.113.7   , 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    expect(extractClientIp(h({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
  });

  it("returns the literal 'unknown' when neither header is present", () => {
    expect(extractClientIp(h({}))).toBe("unknown");
  });

  it("returns 'unknown' when x-forwarded-for is empty or whitespace", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "" }))).toBe("unknown");
    expect(extractClientIp(h({ "x-forwarded-for": "   " }))).toBe("unknown");
  });
});
