import CursorMcp from "@/app/mcp/cursor/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("/mcp/cursor", () => {
  it("references the cursor config path", () => {
    render(<CursorMcp />);
    expect(screen.getAllByText(/\.cursor\/mcp\.json/).length).toBeGreaterThan(0);
  });
});
