import { describe, expect, it } from "vitest";
import { uuidV4, uuidV7 } from "../../src/lib/uuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidV4", () => {
  it("matches the version 4 layout", () => {
    expect(uuidV4()).toMatch(V4);
  });

  it("is different on every call", () => {
    const s = new Set(Array.from({ length: 50 }, () => uuidV4()));
    expect(s.size).toBe(50);
  });
});

describe("uuidV7", () => {
  it("matches the version 7 layout", () => {
    expect(uuidV7()).toMatch(V7);
  });

  it("encodes the given timestamp in the first 48 bits", () => {
    const now = Date.parse("2026-01-01T00:00:00.000Z");
    const id = uuidV7(now);
    const tsHex = id.split("-").slice(0, 2).join("");
    expect(Number.parseInt(tsHex, 16)).toBe(now);
  });

  it("sets the version nibble to 7 and the variant to 10", () => {
    const id = uuidV7();
    const [, , third, fourth] = id.split("-");
    expect(third[0]).toBe("7");
    expect(["8", "9", "a", "b"]).toContain(fourth[0]);
  });

  it("sorts by creation time as plain strings", () => {
    const a = uuidV7(Date.parse("2026-01-01T00:00:00.000Z"));
    const b = uuidV7(Date.parse("2026-06-01T00:00:00.000Z"));
    const c = uuidV7(Date.parse("2026-12-01T00:00:00.000Z"));
    const sorted = [c, a, b].sort();
    expect(sorted).toEqual([a, b, c]);
  });

  it("is distinct across calls in the same millisecond", () => {
    const now = Date.now();
    const a = uuidV7(now);
    const b = uuidV7(now);
    expect(a).not.toBe(b);
  });
});
