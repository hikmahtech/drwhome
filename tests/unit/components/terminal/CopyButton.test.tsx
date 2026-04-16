import { CopyButton } from "@/components/terminal/CopyButton";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("CopyButton", () => {
  it("copies text and shows 'copied' then reverts", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CopyButton value="hello" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("copy");
    await userEvent.click(btn);
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(btn).toHaveTextContent("copied");
  });
});
