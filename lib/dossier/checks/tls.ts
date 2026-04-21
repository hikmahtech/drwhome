import { connect } from "node:tls";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type TlsCheckData = {
  subject: { CN?: string; O?: string };
  issuer: { CN?: string; O?: string };
  validFrom: string;
  validTo: string;
  sans: string[];
  fingerprint256?: string;
  authorized: boolean;
  authorizationError?: string;
};

const DEFAULT_TIMEOUT_MS = 5_000;

function firstString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseSans(san?: string): string[] {
  if (!san) return [];
  return san
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("DNS:"))
    .map((s) => s.slice(4));
}

export async function tlsCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<TlsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise<CheckResult<TlsCheckData>>((resolve) => {
    let done = false;
    const finish = (r: CheckResult<TlsCheckData>) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        /* swallow */
      }
      resolve(r);
    };

    const timer = setTimeout(() => finish({ status: "timeout", ms: timeoutMs }), timeoutMs);

    const socket = connect(
      { host: v.domain, port: 443, servername: v.domain, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) {
          finish({ status: "error", message: "no peer certificate returned" });
          return;
        }
        finish({
          status: "ok",
          data: {
            subject: { CN: firstString(cert.subject?.CN), O: firstString(cert.subject?.O) },
            issuer: { CN: firstString(cert.issuer?.CN), O: firstString(cert.issuer?.O) },
            validFrom: cert.valid_from ?? "",
            validTo: cert.valid_to ?? "",
            sans: parseSans(cert.subjectaltname),
            fingerprint256: cert.fingerprint256,
            authorized: socket.authorized,
            authorizationError: socket.authorizationError?.message,
          },
          fetchedAt: new Date().toISOString(),
        });
      },
    );

    socket.setTimeout(timeoutMs);
    socket.on("error", (err: Error) => finish({ status: "error", message: err.message }));
    socket.on("timeout", () => finish({ status: "timeout", ms: timeoutMs }));
  });
}
