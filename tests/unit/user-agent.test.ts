import { describe, expect, it } from "vitest";
import { parseUserAgent } from "../../src/lib/user-agent";

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/128.0.0.0 Mobile Safari/537.36";

const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

describe("parseUserAgent", () => {
  it("reads browser, os, device and engine from an Android Chrome string", () => {
    const r = parseUserAgent(CHROME_ANDROID);
    expect(r.browser.name).toBe("Mobile Chrome");
    expect(r.os.name).toBe("Android");
    expect(r.engine.name).toBe("Blink");
  });

  it("reads an iPhone Safari string", () => {
    const r = parseUserAgent(SAFARI_IOS);
    expect(r.browser.name).toBe("Mobile Safari");
    expect(r.os.name).toBe("iOS");
    expect(r.device.type).toBe("mobile");
  });

  it("returns empty strings, not undefined, for an empty string", () => {
    const r = parseUserAgent("");
    expect(r.browser.name).toBe("");
    expect(r.os.name).toBe("");
    expect(r.device.vendor).toBe("");
    expect(r.engine.name).toBe("");
  });

  it("does not throw on gibberish input", () => {
    expect(() => parseUserAgent("not a real user agent string")).not.toThrow();
  });
});
