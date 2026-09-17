import { createServer } from "node:http";
import net, { type AddressInfo } from "node:net";
import tls from "node:tls";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  checkPublic,
  guardedRun,
  installNetworkGuard,
  isPublicAddress,
} from "../../src/server/ssrf";

describe("isPublicAddress", () => {
  it.each([
    "10.1.2.3",
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.10",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:10.1.2.3",
    "::ffff:a14:f",
    "[::1]",
    "not-an-ip",
    "",
  ])("refuses %s", (ip) => expect(isPublicAddress(ip)).toBe(false));

  it.each(["1.1.1.1", "8.8.8.8", "172.15.0.1", "172.32.0.1", "100.63.0.1", "2606:4700::1111"])(
    "allows %s",
    (ip) => expect(isPublicAddress(ip)).toBe(true),
  );
});

describe("network guard", () => {
  // A real listener on loopback stands in for an internal service.
  const server = createServer((_, res) => res.end("internal secret"));
  let port = 0;
  beforeAll(async () => {
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    port = (server.address() as AddressInfo).port;
    installNetworkGuard();
  });
  afterAll(() => server.close());

  it("refuses an IP literal", async () => {
    await expect(fetch(`http://127.0.0.1:${port}/`)).rejects.toThrow();
  });

  it("refuses a name that resolves to a private address", async () => {
    await expect(fetch(`http://localhost:${port}/`)).rejects.toThrow();
  });

  // The TLS and WHOIS checks open sockets without fetch. WHOIS even takes its next hostname
  // from a registrar's reply, so the guard has to sit at the socket layer.
  const connects = (open: () => net.Socket) =>
    new Promise<string>((resolve) => {
      const s = open();
      s.once("connect", () => {
        s.destroy();
        resolve("connected");
      });
      s.once("error", (e: NodeJS.ErrnoException) => resolve(e.code ?? e.message));
    });

  it.each([
    ["net, IP literal", () => net.connect({ host: "127.0.0.1", port })],
    ["net, (port, host) form", () => net.connect(port, "127.0.0.1")],
    ["net, default host", () => net.connect(port)],
    ["net, private name", () => net.connect({ host: "localhost", port })],
    ["tls, IP literal", () => tls.connect({ host: "127.0.0.1", port, rejectUnauthorized: false })],
    [
      "tls, private name",
      () => tls.connect({ host: "localhost", port, rejectUnauthorized: false }),
    ],
  ])("refuses a raw socket: %s", async (_, open) => {
    expect(await connects(open as () => net.Socket)).toBe("ERR_BLOCKED_ADDRESS");
  });

  it("still allows a public address", async () => {
    expect(await connects(() => net.connect({ host: "1.1.1.1", port: 443 }))).toBe("connected");
  });
});

describe("guardedRun", () => {
  it("never runs the check for an invalid domain", async () => {
    let ran = false;
    const r = await guardedRun("10.1.2.3", async () => {
      ran = true;
      return { verdict: "x", tone: "good", rows: [] };
    });
    expect(ran).toBe(false);
    expect(r.tone).toBe("bad");
  });
});

describe("checkPublic says why it refused", () => {
  const doh = (answers: Record<string, string[]>) =>
    vi.fn(async (input: string | URL) => {
      const u = new URL(String(input));
      const type = u.searchParams.get("type") === "AAAA" ? 28 : 1;
      const data = answers[u.searchParams.get("type") ?? "A"] ?? [];
      return new Response(
        JSON.stringify({
          Status: 0,
          Answer: data.map((d) => ({ name: "x", type, TTL: 60, data: d })),
        }),
      );
    });

  it("passes a public domain", async () => {
    vi.stubGlobal("fetch", doh({ A: ["93.184.216.34"] }));
    expect(await checkPublic("example.com")).toEqual({ ok: true });
  });

  it("calls a private address a refusal", async () => {
    vi.stubGlobal("fetch", doh({ A: ["10.1.2.3"] }));
    const r = await checkPublic("evil.example.org");
    expect(r).toMatchObject({ ok: false, tone: "bad" });
  });

  it("never blames the domain when the lookup itself failed, and retries once", async () => {
    const failing = vi.fn(async () => new Response("", { status: 502 }));
    vi.stubGlobal("fetch", failing);
    const r = await checkPublic("example.com");
    expect(r).toMatchObject({ ok: false, tone: "warn" });
    expect(r.ok === false && r.message).toContain("Try again");
    // Two lookups (A and AAAA) per attempt, two attempts.
    expect(failing).toHaveBeenCalledTimes(4);
  });

  it("recovers when only the first attempt fails", async () => {
    const good = doh({ A: ["93.184.216.34"] });
    let calls = 0;
    vi.stubGlobal("fetch", (input: string | URL) =>
      ++calls <= 2 ? Promise.resolve(new Response("", { status: 502 })) : good(input),
    );
    expect(await checkPublic("example.com")).toEqual({ ok: true });
  });

  it("says so when the domain has no address at all", async () => {
    vi.stubGlobal("fetch", doh({}));
    const r = await checkPublic("mail-only.example.org");
    expect(r.ok === false && r.message).toContain("no A or AAAA record");
  });
});
