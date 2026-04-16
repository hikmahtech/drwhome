import { afterEach, describe, expect, it } from "vitest";
import { getStoredTheme, setStoredTheme } from "@/lib/theme";

describe("theme storage", () => {
  afterEach(() => localStorage.clear());

  it("returns null when unset", () => {
    expect(getStoredTheme()).toBeNull();
  });
  it("stores and retrieves light/dark", () => {
    setStoredTheme("dark");
    expect(getStoredTheme()).toBe("dark");
    setStoredTheme("light");
    expect(getStoredTheme()).toBe("light");
  });
  it("setStoredTheme(null) clears", () => {
    setStoredTheme("dark");
    setStoredTheme(null);
    expect(getStoredTheme()).toBeNull();
  });
});
