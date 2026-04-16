import { formatJson } from "@/lib/tools/json";
import { describe, expect, it } from "vitest";

describe("formatJson", () => {
  it("formats valid JSON with 2-space indent by default", () => {
    const r = formatJson('{"a":1,"b":[2,3]}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });
  it("respects indent parameter", () => {
    const r = formatJson('{"a":1}', 4);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{\n    "a": 1\n}');
  });
  it("indent=0 returns minified", () => {
    const r = formatJson('{"a": 1, "b": 2}', 0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{"a":1,"b":2}');
  });
  it("returns error with message on invalid JSON", () => {
    const r = formatJson("{bad");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/.+/);
  });
  it("handles empty string", () => {
    const r = formatJson("");
    expect(r.ok).toBe(false);
  });
  it("handles nested and arrays", () => {
    const r = formatJson('[{"x":true,"y":null}]');
    expect(r.ok).toBe(true);
  });
});
