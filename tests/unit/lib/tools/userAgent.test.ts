import { parseUserAgent } from "@/lib/tools/userAgent";
import { describe, expect, it } from "vitest";

describe("parseUserAgent", () => {
  it("parses Chrome on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const r = parseUserAgent(ua);
    expect(r.browser.name).toBe("Chrome");
    expect(r.os.name).toBe("macOS");
  });
  it("parses an iPhone Safari UA", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
    const r = parseUserAgent(ua);
    expect(r.browser.name).toMatch(/Safari|Mobile Safari/);
    expect(r.device.type).toBe("mobile");
  });
  it("handles unknown UA gracefully", () => {
    const r = parseUserAgent("weird-bot/0.1");
    expect(r.browser.name ?? "").toBeDefined();
  });
});
