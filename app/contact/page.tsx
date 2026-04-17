"use client";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { useState } from "react";
import { sendContact } from "./actions";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    const res = await sendContact(new FormData(form));
    if (res.ok) {
      form.reset();
      setStatus("ok");
    } else {
      setErr(res.error);
      setStatus("err");
    }
  }

  return (
    <article className="space-y-4">
      <TerminalPrompt>contact</TerminalPrompt>
      <p className="text-sm text-muted">send a message. replies come from a human.</p>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <label className="block">
          name
          <input name="name" required className="block w-full mt-1 border bg-bg p-2" />
        </label>
        <label className="block">
          email
          <input
            name="email"
            type="email"
            required
            className="block w-full mt-1 border bg-bg p-2"
          />
        </label>
        <label className="block">
          message
          <textarea
            name="message"
            required
            rows={6}
            className="block w-full mt-1 border bg-bg p-2"
          />
        </label>
        <button type="submit" disabled={status === "sending"} className="border px-3 py-1">
          {status === "sending" ? "sending..." : "send"}
        </button>
      </form>
      {status === "ok" && <TerminalCard label="status">sent. we&apos;ll reply soon.</TerminalCard>}
      {status === "err" && <TerminalCard label="error">{err}</TerminalCard>}
    </article>
  );
}
