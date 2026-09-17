import { describe, expect, it } from "vitest";
import { headerRows, isHiddenHeader } from "../../src/views/pages/headers";

describe("isHiddenHeader", () => {
  it("hides every cf-* header except cf-ipcountry", () => {
    expect(isHiddenHeader("cf-ray")).toBe(true);
    expect(isHiddenHeader("cf-connecting-ip")).toBe(true);
    expect(isHiddenHeader("CF-Ray")).toBe(true);
    expect(isHiddenHeader("cf-ipcountry")).toBe(false);
    expect(isHiddenHeader("CF-IPCountry")).toBe(false);
  });

  it("hides x-forwarded-* headers", () => {
    expect(isHiddenHeader("x-forwarded-for")).toBe(true);
    expect(isHiddenHeader("x-forwarded-proto")).toBe(true);
  });

  it("hides the exact infrastructure header names", () => {
    expect(isHiddenHeader("x-real-ip")).toBe(true);
    expect(isHiddenHeader("cdn-loop")).toBe(true);
    expect(isHiddenHeader("traceparent")).toBe(true);
  });

  it("keeps ordinary browser headers", () => {
    expect(isHiddenHeader("accept-language")).toBe(false);
    expect(isHiddenHeader("user-agent")).toBe(false);
    expect(isHiddenHeader("cookie")).toBe(false);
    expect(isHiddenHeader("host")).toBe(false);
  });
});

describe("headerRows", () => {
  it("sorts by name and drops hidden headers", () => {
    const headers = new Headers([
      ["user-agent", "test-agent"],
      ["accept-language", "en"],
      ["cf-ray", "abc123"],
      ["cf-ipcountry", "US"],
      ["x-forwarded-for", "1.2.3.4"],
    ]);
    expect(headerRows(headers)).toEqual([
      { label: "accept-language", value: "en" },
      { label: "cf-ipcountry", value: "US" },
      { label: "user-agent", value: "test-agent" },
    ]);
  });

  it("returns an empty list for no headers", () => {
    expect(headerRows(new Headers())).toEqual([]);
  });
});
