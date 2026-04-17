"use server";

import { validateWaitlistInput } from "@/lib/waitlist";
import { kv } from "@vercel/kv";
import { Resend } from "resend";

export type WaitlistActionResult = { ok: true } | { ok: false; error: string };

export async function joinWaitlist(formData: FormData): Promise<WaitlistActionResult> {
  const input = {
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    honeypot: String(formData.get("company") ?? ""),
  };

  const v = validateWaitlistInput(input);
  if (!v.ok) {
    // Mask the honeypot signal — real users never see this field; bots shouldn't learn
    // the detection method. Surface other validation errors unchanged so real users can fix them.
    const error = v.error === "honeypot tripped" ? "form submission failed" : v.error;
    return { ok: false, error };
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { ok: false, error: "waitlist temporarily unavailable" };
  }

  try {
    await kv.lpush("waitlist:mcp", JSON.stringify(v.record));
  } catch {
    return { ok: false, error: "waitlist temporarily unavailable" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (apiKey && to) {
    const resend = new Resend(apiKey);
    // Fire-and-forget; a delivery failure shouldn't invalidate a stored signup.
    await resend.emails
      .send({
        from: "drwho.me <noreply@drwho.me>",
        to,
        subject: `[drwho.me waitlist] ${v.record.email}`,
        text: `Email: ${v.record.email}\nNotes: ${v.record.notes || "(none)"}\nAt: ${v.record.createdAt}`,
      })
      .catch(() => undefined);
  }

  return { ok: true };
}
