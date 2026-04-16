import { decodeBase64, encodeBase64 } from "@/lib/tools/base64";
import { describe, expect, it } from "vitest";

describe("encodeBase64", () => {
  it("encodes ASCII", () => {
    expect(encodeBase64("hello").value).toBe("aGVsbG8=");
  });
  it("encodes unicode", () => {
    expect(encodeBase64("héllo ✓").value).toBe("aMOpbGxvIOKckw==");
  });
  it("encodes empty string", () => {
    expect(encodeBase64("").value).toBe("");
  });
});

describe("decodeBase64", () => {
  it("decodes ASCII", () => {
    expect(decodeBase64("aGVsbG8=")).toEqual({ ok: true, value: "hello" });
  });
  it("decodes unicode", () => {
    expect(decodeBase64("aMOpbGxvIOKckw==")).toEqual({ ok: true, value: "héllo ✓" });
  });
  it("returns error on invalid input", () => {
    const r = decodeBase64("@@@not-base64@@@");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/invalid/i);
  });
  it("handles URL-safe base64", () => {
    expect(decodeBase64("aGVsbG8")).toEqual({ ok: true, value: "hello" });
  });
});
