import { TerminalCard } from "@/components/terminal/TerminalCard";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("TerminalCard", () => {
  it("renders children", () => {
    render(<TerminalCard>hello</TerminalCard>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
  it("renders label when provided", () => {
    render(<TerminalCard label="output">body</TerminalCard>);
    expect(screen.getByText("$ output")).toBeInTheDocument();
  });
});
