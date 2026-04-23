import { DossierViewTracker } from "@/components/dossier/DossierViewTracker";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("DossierViewTracker", () => {
  it("fires dossier_viewed exactly once on mount", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { rerender } = render(<DossierViewTracker domain="stripe.com" />);
    rerender(<DossierViewTracker domain="stripe.com" />);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "dossier_viewed", {
      domain: "stripe.com",
    });
  });

  it("renders nothing", () => {
    const { container } = render(<DossierViewTracker domain="stripe.com" />);
    expect(container.firstChild).toBeNull();
  });
});
