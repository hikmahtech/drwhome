export type WaitlistRecord = {
  email: string;
  notes: string;
  createdAt: string; // ISO 8601
};

export type WaitlistInput = {
  email: string;
  notes: string;
  honeypot: string; // hidden form field; real users leave empty
};

export type ValidationResult = { ok: true; record: WaitlistRecord } | { ok: false; error: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_NOTES_LENGTH = 500;

export function validateWaitlistInput(input: WaitlistInput): ValidationResult {
  if (input.honeypot.trim() !== "") {
    return { ok: false, error: "honeypot tripped" };
  }
  const email = input.email.trim();
  if (!email) return { ok: false, error: "email required" };
  if (!EMAIL.test(email)) return { ok: false, error: "invalid email" };
  const notes = input.notes ?? "";
  if (notes.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: `notes must be ${MAX_NOTES_LENGTH} characters or fewer` };
  }
  return {
    ok: true,
    record: { email, notes, createdAt: new Date().toISOString() },
  };
}
