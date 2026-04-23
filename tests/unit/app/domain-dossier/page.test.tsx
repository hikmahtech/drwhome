import DomainDossier from "@/app/domain-dossier/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("DomainDossier landing", () => {
  it("renders the hero heading", () => {
    render(<DomainDossier />);
    expect(screen.getByRole("heading", { name: /domain health checker/i })).toBeDefined();
  });

  it("lists all ten check sections", () => {
    render(<DomainDossier />);
    for (const h of [
      "dns",
      "mx",
      "spf",
      "dmarc",
      "dkim",
      "tls",
      "redirects",
      "headers",
      "cors",
      "web surface",
    ]) {
      expect(screen.getByRole("heading", { name: new RegExp(h, "i") })).toBeDefined();
    }
  });

  it("includes FAQ and SoftwareApplication json-ld", () => {
    const { container } = render(<DomainDossier />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const payloads = Array.from(scripts).map((s) => JSON.parse(s.textContent ?? ""));
    expect(payloads.some((p) => p["@type"] === "SoftwareApplication")).toBe(true);
    expect(payloads.some((p) => p["@type"] === "FAQPage")).toBe(true);
  });
});
