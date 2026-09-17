import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl } from "../../src/lib/url";

describe("encodeUrl", () => {
  it("encodes spaces and special characters", () => {
    expect(encodeUrl("hello world/?&=")).toBe("hello%20world%2F%3F%26%3D");
  });

  it("encodes unicode", () => {
    expect(encodeUrl("café")).toBe("caf%C3%A9");
  });

  it("passes an empty string through", () => {
    expect(encodeUrl("")).toBe("");
  });
});

describe("decodeUrl", () => {
  it("decodes a valid encoded string", () => {
    expect(decodeUrl("hello%20world")).toEqual({ ok: true, value: "hello world" });
  });

  it("decodes unicode", () => {
    expect(decodeUrl("caf%C3%A9")).toEqual({ ok: true, value: "café" });
  });

  it("errors on malformed percent-encoding", () => {
    expect(decodeUrl("%ZZ").ok).toBe(false);
  });

  it("errors on a lone percent", () => {
    expect(decodeUrl("%").ok).toBe(false);
  });
});
