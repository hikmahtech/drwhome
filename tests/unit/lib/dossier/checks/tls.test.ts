import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

type PeerCert = {
  subject?: { CN?: string; O?: string };
  issuer?: { CN?: string; O?: string };
  valid_from: string;
  valid_to: string;
  subjectaltname?: string;
  fingerprint256?: string;
};

class FakeSocket extends EventEmitter {
  authorized = true;
  authorizationError: Error | null = null;
  private peerCert: PeerCert;
  constructor(peerCert: PeerCert) {
    super();
    this.peerCert = peerCert;
  }
  getPeerCertificate() {
    return this.peerCert;
  }
  end() {}
  setTimeout() {}
  destroy() {
    this.emit("close");
  }
}

const { mockConnect } = vi.hoisted(() => ({ mockConnect: vi.fn() }));
vi.mock("node:tls", () => {
  const connect = (...args: unknown[]) => mockConnect(...args);
  return { connect, default: { connect } };
});

import { tlsCheck } from "@/lib/dossier/checks/tls";

describe("tlsCheck", () => {
  afterEach(() => {
    mockConnect.mockReset();
  });

  it("rejects invalid domain", async () => {
    expect((await tlsCheck("nope")).status).toBe("error");
  });

  it("returns ok with cert fields on successful handshake", async () => {
    const peerCert: PeerCert = {
      subject: { CN: "example.com" },
      issuer: { CN: "Some CA", O: "Some CA Inc" },
      valid_from: "Jan  1 00:00:00 2026 GMT",
      valid_to: "Jan  1 00:00:00 2027 GMT",
      subjectaltname: "DNS:example.com, DNS:www.example.com",
      fingerprint256: "AA:BB:CC",
    };
    const sock = new FakeSocket(peerCert);
    mockConnect.mockImplementation((_opts: unknown, cb: () => void) => {
      queueMicrotask(() => cb());
      return sock;
    });

    const r = await tlsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.subject.CN).toBe("example.com");
      expect(r.data.sans).toEqual(["example.com", "www.example.com"]);
      expect(r.data.validFrom).toBe("Jan  1 00:00:00 2026 GMT");
      expect(r.data.validTo).toBe("Jan  1 00:00:00 2027 GMT");
      expect(r.data.fingerprint256).toBe("AA:BB:CC");
      expect(r.data.authorized).toBe(true);
    }
  });

  it("returns ok with authorized=false when handshake reports auth error", async () => {
    const sock = new FakeSocket({
      subject: {},
      issuer: {},
      valid_from: "",
      valid_to: "",
    });
    sock.authorized = false;
    sock.authorizationError = new Error("CERT_HAS_EXPIRED");
    mockConnect.mockImplementation((_opts: unknown, cb: () => void) => {
      queueMicrotask(() => cb());
      return sock;
    });

    const r = await tlsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.authorized).toBe(false);
      expect(r.data.authorizationError).toBe("CERT_HAS_EXPIRED");
    }
  });

  it("returns error on socket error event", async () => {
    const sock = new FakeSocket({ subject: {}, issuer: {}, valid_from: "", valid_to: "" });
    mockConnect.mockImplementation(() => {
      queueMicrotask(() => sock.emit("error", new Error("ECONNREFUSED")));
      return sock;
    });
    const r = await tlsCheck("example.com");
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toMatch(/ECONNREFUSED/);
  });

  it("returns timeout if handshake never completes", async () => {
    const sock = new FakeSocket({ subject: {}, issuer: {}, valid_from: "", valid_to: "" });
    mockConnect.mockImplementation(() => sock);
    const r = await tlsCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  });
});
