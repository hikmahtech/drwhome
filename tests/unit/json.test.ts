import { describe, expect, it } from "vitest";
import { formatJson } from "../../src/lib/json";

describe("formatJson", () => {
  it("formats valid JSON with 2-space indent by default", () => {
    const r = formatJson('{"a":1,"b":[2,3]}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it("respects a 4-space indent", () => {
    const r = formatJson('{"a":1}', 4);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{\n    "a": 1\n}');
  });

  it("indent 0 minifies", () => {
    const r = formatJson('{"a": 1, "b": 2}', 0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{"a":1,"b":2}');
  });

  it("returns the parser's own message on invalid JSON", () => {
    const r = formatJson("{bad");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/.+/);
  });

  it("rejects empty input", () => {
    expect(formatJson("").ok).toBe(false);
    expect(formatJson("   ").ok).toBe(false);
  });

  it("handles nested objects and arrays", () => {
    const r = formatJson('[{"x":true,"y":null}]');
    expect(r.ok).toBe(true);
  });
});
