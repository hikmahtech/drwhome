"use client";

import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useState } from "react";
import { joinWaitlist } from "./actions";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const res = await joinWaitlist(new FormData(e.currentTarget));
    if (res.ok) {
      setStatus("ok");
      e.currentTarget.reset();
    } else {
      setErr(res.error);
      setStatus("err");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm" aria-label="waitlist">
      <label className="block">
        email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="block w-full mt-1 border bg-bg p-2"
        />
      </label>
      <label className="block">
        what would you use this for? <span className="text-muted">(optional)</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          className="block w-full mt-1 border bg-bg p-2"
        />
      </label>
      {/* Honeypot — hidden from humans, left empty. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <button type="submit" disabled={status === "sending"} className="border px-3 py-1">
        {status === "sending" ? "joining..." : "join waitlist"}
      </button>
      {status === "ok" && (
        <TerminalCard label="status">you&apos;re on the list. we&apos;ll be in touch.</TerminalCard>
      )}
      {status === "err" && <TerminalCard label="error">{err}</TerminalCard>}
    </form>
  );
}
