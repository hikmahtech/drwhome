"use server";
import { Resend } from "resend";

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContact(formData: FormData): Promise<ContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) return { ok: false, error: "all fields required" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "invalid email" };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return { ok: false, error: "contact temporarily unavailable" };

  const resend = new Resend(apiKey);
  const res = await resend.emails.send({
    from: "drwho.me <noreply@drwho.me>",
    to,
    replyTo: email,
    subject: `[drwho.me contact] from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (res.error) return { ok: false, error: "send failed" };
  return { ok: true };
}
