import { DomainInput } from "@/app/domain-dossier/DomainInput";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => push.mockReset());

function form(): HTMLFormElement {
  const el = screen.getByRole("textbox").closest("form");
  if (!el) throw new Error("form not found");
  return el;
}

describe("DomainInput", () => {
  it("navigates to /d/<domain> on submit", () => {
    render(<DomainInput />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "stripe.com" } });
    fireEvent.submit(form());
    expect(push).toHaveBeenCalledWith("/d/stripe.com");
  });

  it("trims whitespace and lowercases before navigation", () => {
    render(<DomainInput />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  STRIPE.COM  " } });
    fireEvent.submit(form());
    expect(push).toHaveBeenCalledWith("/d/stripe.com");
  });

  it("does not navigate on empty submit", () => {
    render(<DomainInput />);
    fireEvent.submit(form());
    expect(push).not.toHaveBeenCalled();
  });
});
