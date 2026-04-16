import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const kvLpush = vi.fn();
const resendSend = vi.fn();

vi.mock("@vercel/kv", () => ({
  kv: { lpush: (...args: unknown[]) => kvLpush(...args) },
}));

vi.mock("resend", () => ({
  Resend: function ResendMock() {
    return { emails: { send: (...args: unknown[]) => resendSend(...args) } };
  },
}));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function unsetEnv(...keys: string[]): void {
  for (const k of keys) delete process.env[k];
}

describe("joinWaitlist", () => {
  beforeEach(() => {
    kvLpush.mockReset();
    resendSend.mockReset();
    kvLpush.mockResolvedValue(1);
    resendSend.mockResolvedValue({ error: null });
    process.env.KV_REST_API_URL = "https://kv.example.com";
    process.env.KV_REST_API_TOKEN = "token";
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "waitlist@drwho.me";
  });

  afterEach(() => {
    unsetEnv("KV_REST_API_URL", "KV_REST_API_TOKEN", "RESEND_API_KEY", "CONTACT_TO_EMAIL");
  });

  it("stores a valid record in KV list waitlist:mcp and emails the inbox", async () => {
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(
      formData({ email: "a@b.co", notes: "rate limits", company: "" }),
    );
    expect(res).toEqual({ ok: true });
    expect(kvLpush).toHaveBeenCalledOnce();
    expect(kvLpush).toHaveBeenCalledWith("waitlist:mcp", expect.stringContaining('"a@b.co"'));
    expect(resendSend).toHaveBeenCalledOnce();
    const emailArgs = resendSend.mock.calls[0][0] as { to: string; subject: string; text: string };
    expect(emailArgs.to).toBe("waitlist@drwho.me");
    expect(emailArgs.subject).toContain("a@b.co");
    expect(emailArgs.text).toContain("rate limits");
  });

  it("rejects invalid email without touching KV or Resend", async () => {
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "not-email", notes: "", company: "" }));
    expect(res.ok).toBe(false);
    expect(kvLpush).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
  });

  it("rejects when honeypot is filled without touching KV or Resend", async () => {
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "bot" }));
    expect(res.ok).toBe(false);
    expect(kvLpush).not.toHaveBeenCalled();
  });

  it("returns 'temporarily unavailable' when KV env vars are missing", async () => {
    unsetEnv("KV_REST_API_URL", "KV_REST_API_TOKEN");
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "" }));
    expect(res).toEqual({ ok: false, error: "waitlist temporarily unavailable" });
    expect(kvLpush).not.toHaveBeenCalled();
  });

  it("returns 'temporarily unavailable' when KV throws", async () => {
    kvLpush.mockRejectedValueOnce(new Error("boom"));
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "" }));
    expect(res).toEqual({ ok: false, error: "waitlist temporarily unavailable" });
  });

  it("still returns ok when Resend fails (record is stored; email is best-effort)", async () => {
    resendSend.mockRejectedValueOnce(new Error("smtp fail"));
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "" }));
    expect(res).toEqual({ ok: true });
    expect(kvLpush).toHaveBeenCalledOnce();
  });
});
