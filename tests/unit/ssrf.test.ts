import { createServer } from "node:http";
import net, { type AddressInfo } from "node:net";
import tls from "node:tls";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { guardedRun, installNetworkGuard, isPublicAddress } from "../../src/server/ssrf";

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
