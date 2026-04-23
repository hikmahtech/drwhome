import { McpInstallButton } from "@/components/mcp/McpInstallButton";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("McpInstallButton", () => {
  it("copies config to clipboard and fires mcp_install_click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<McpInstallButton client="claude" config={"{foo:1}"} />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    await screen.findByText(/copied/i);

    expect(writeText).toHaveBeenCalledWith("{foo:1}");
    expect(gtag).toHaveBeenCalledWith("event", "mcp_install_click", {
      client: "claude",
    });
  });
});
