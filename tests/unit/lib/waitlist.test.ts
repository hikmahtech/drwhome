import { validateWaitlistInput } from "@/lib/waitlist";
import { describe, expect, it } from "vitest";

describe("validateWaitlistInput", () => {
  it("accepts a valid submission with notes", () => {
    const r = validateWaitlistInput({
      email: "dev@example.com",
      notes: "would pay for higher rate limits",
      honeypot: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.record.email).toBe("dev@example.com");
      expect(r.record.notes).toBe("would pay for higher rate limits");
      expect(r.record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("accepts a valid submission without notes (notes optional)", () => {
    const r = validateWaitlistInput({ email: "dev@example.com", notes: "", honeypot: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.record.notes).toBe("");
  });

  it("trims surrounding whitespace on email", () => {
    const r = validateWaitlistInput({ email: "  a@b.co  ", notes: "", honeypot: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.record.email).toBe("a@b.co");
  });

  it("rejects when email is missing", () => {
    const r = validateWaitlistInput({ email: "", notes: "", honeypot: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects when email is not syntactically an email", () => {
    const r = validateWaitlistInput({ email: "not-an-email", notes: "", honeypot: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects when the honeypot field is non-empty (likely bot)", () => {
    const r = validateWaitlistInput({ email: "a@b.co", notes: "hi", honeypot: "gotcha" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/honeypot|spam|bot/i);
  });

  it("rejects notes longer than 500 chars", () => {
    const r = validateWaitlistInput({
      email: "a@b.co",
      notes: "x".repeat(501),
      honeypot: "",
    });
    expect(r.ok).toBe(false);
  });

  it("allows notes up to 500 chars", () => {
    const r = validateWaitlistInput({
      email: "a@b.co",
      notes: "x".repeat(500),
      honeypot: "",
    });
    expect(r.ok).toBe(true);
  });
});
