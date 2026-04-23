import { ShareButton } from "@/components/dossier/ShareButton";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
  vi.restoreAllMocks();
});

describe("ShareButton", () => {
  it("copies location to clipboard and fires analytics on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<ShareButton domain="stripe.com" href="https://drwho.me/d/stripe.com" />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    await screen.findByText(/copied/i);

    expect(writeText).toHaveBeenCalledWith("https://drwho.me/d/stripe.com");
    expect(gtag).toHaveBeenCalledWith("event", "dossier_shared", {
      domain: "stripe.com",
    });
  });

  it("shows copied state after click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<ShareButton domain="stripe.com" href="https://drwho.me/d/stripe.com" />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(await screen.findByText(/copied/i)).toBeDefined();
  });
});
