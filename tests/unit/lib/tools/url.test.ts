import { decodeUrl, encodeUrl } from "@/lib/tools/url";
import { describe, expect, it } from "vitest";

describe("encodeUrl", () => {
  it("encodes spaces and special chars", () => {
    expect(encodeUrl("hello world/?&=").value).toBe("hello%20world%2F%3F%26%3D");
  });
  it("encodes unicode", () => {
    expect(encodeUrl("café").value).toBe("caf%C3%A9");
  });
  it("empty string passes through", () => {
    expect(encodeUrl("").value).toBe("");
  });
});

describe("decodeUrl", () => {
  it("decodes valid encoded string", () => {
    expect(decodeUrl("hello%20world")).toEqual({ ok: true, value: "hello world" });
  });
  it("decodes unicode", () => {
    expect(decodeUrl("caf%C3%A9")).toEqual({ ok: true, value: "café" });
  });
  it("errors on malformed percent", () => {
    const r = decodeUrl("%ZZ");
    expect(r.ok).toBe(false);
  });
  it("errors on lone percent", () => {
    const r = decodeUrl("%");
    expect(r.ok).toBe(false);
  });
});
