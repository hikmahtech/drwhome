import { RateLimitBanner } from "@/components/dossier/RateLimitBanner";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RateLimitBanner", () => {
  it("renders the domain and the reset-at timestamp", () => {
    const resetAt = new Date("2026-04-22T12:00:00Z");
    render(<RateLimitBanner domain="example.com" resetAt={resetAt} />);
    expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/2026-04-22T12:00:00/)).toBeInTheDocument();
    expect(screen.getByText(/rate limit/i)).toBeInTheDocument();
  });
});
