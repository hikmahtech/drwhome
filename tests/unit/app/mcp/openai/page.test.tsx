import OpenaiMcp from "@/app/mcp/openai/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("/mcp/openai", () => {
  it("mentions custom GPT actions", () => {
    render(<OpenaiMcp />);
    expect(screen.getAllByText(/custom gpt/i).length).toBeGreaterThan(0);
  });
});
