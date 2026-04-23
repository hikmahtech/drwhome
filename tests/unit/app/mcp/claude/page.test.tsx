import ClaudeMcp from "@/app/mcp/claude/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("/mcp/claude", () => {
  it("renders the Claude install heading", () => {
    render(<ClaudeMcp />);
    expect(screen.getAllByText(/claude desktop/i).length).toBeGreaterThan(0);
  });

  it("shows the mcp-remote config snippet", () => {
    render(<ClaudeMcp />);
    expect(screen.getAllByText(/mcp-remote/i).length).toBeGreaterThan(0);
  });
});
