import { DenylistBanner } from "@/components/dossier/DenylistBanner";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("DenylistBanner", () => {
  it("renders the domain and the reason text", () => {
    render(<DenylistBanner domain="bad.example" reason="abuse report" />);
    expect(screen.getByText(/bad\.example/)).toBeInTheDocument();
    expect(screen.getByText(/abuse report/i)).toBeInTheDocument();
  });
});
