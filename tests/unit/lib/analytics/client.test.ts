import { trackToolExecuted } from "@/lib/analytics/client";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("trackToolExecuted", () => {
  it("calls gtag with tool_executed event and params", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackToolExecuted("base64", true);
    expect(gtag).toHaveBeenCalledWith("event", "tool_executed", {
      tool_slug: "base64",
      success: true,
    });
  });

  it("forwards failure flag", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackToolExecuted("jwt", false);
    expect(gtag).toHaveBeenCalledWith("event", "tool_executed", {
      tool_slug: "jwt",
      success: false,
    });
  });

  it("no-ops when gtag is undefined", () => {
    window.gtag = undefined;
    expect(() => trackToolExecuted("base64", true)).not.toThrow();
  });
});
