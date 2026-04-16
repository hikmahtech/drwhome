import { generateUuid } from "@/lib/tools/uuid";
import { describe, expect, it } from "vitest";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuid", () => {
  it("v4 returns a valid UUIDv4", () => {
    expect(generateUuid("v4")).toMatch(V4);
  });
  it("v7 returns a valid UUIDv7 layout", () => {
    expect(generateUuid("v7")).toMatch(V7);
  });
  it("v4 calls are unique", () => {
    const s = new Set(Array.from({ length: 50 }, () => generateUuid("v4")));
    expect(s.size).toBe(50);
  });
  it("v7 is monotonic (or at least distinct)", () => {
    const a = generateUuid("v7");
    const b = generateUuid("v7");
    expect(a).not.toBe(b);
  });
});
