import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("TerminalPrompt", () => {
  it("renders > prefix + text in an h1 by default", () => {
    render(<TerminalPrompt>base64</TerminalPrompt>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("> base64");
  });
});
