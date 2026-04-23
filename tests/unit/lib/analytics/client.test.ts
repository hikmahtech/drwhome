import {
  trackBlogToolClick,
  trackDossierShared,
  trackDossierViewed,
  trackMcpInstallClick,
  trackToolExecuted,
} from "@/lib/analytics/client";
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

describe("trackDossierViewed", () => {
  it("fires dossier_viewed with domain", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackDossierViewed("stripe.com");
    expect(gtag).toHaveBeenCalledWith("event", "dossier_viewed", {
      domain: "stripe.com",
    });
  });

  it("no-ops when gtag is undefined", () => {
    expect(() => trackDossierViewed("stripe.com")).not.toThrow();
  });
});

describe("trackDossierShared", () => {
  it("fires dossier_shared with domain", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackDossierShared("stripe.com");
    expect(gtag).toHaveBeenCalledWith("event", "dossier_shared", {
      domain: "stripe.com",
    });
  });
});

describe("trackMcpInstallClick", () => {
  it("fires mcp_install_click with client id", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackMcpInstallClick("claude");
    expect(gtag).toHaveBeenCalledWith("event", "mcp_install_click", {
      client: "claude",
    });
  });
});

describe("trackBlogToolClick", () => {
  it("fires blog_tool_click with post and tool slugs", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackBlogToolClick("what-is-dmarc", "dmarc-checker");
    expect(gtag).toHaveBeenCalledWith("event", "blog_tool_click", {
      post_slug: "what-is-dmarc",
      tool_slug: "dmarc-checker",
    });
  });
});
