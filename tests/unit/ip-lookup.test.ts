import { describe, expect, it } from "vitest";
import { app } from "../../src/app";

const get = (path: string, headers?: Record<string, string>) =>
  app.request(`http://drwho.me${path}`, { headers });

describe("ip-lookup page", () => {
  it("serves the form with no report when no ip is given", async () => {
    const html = await (await get("/tools/ip-lookup")).text();
    expect(html).toContain('name="ip"');
    expect(html).not.toContain("verdict");
  });

  it("gives a clear verdict for an invalid address, without needing ipinfo configured", async () => {
    const html = await (await get("/tools/ip-lookup?ip=not-an-address")).text();
    expect(html).toContain("That is not an IPv4 or IPv6 address.");
  });

  it("does not echo an invalid address back unescaped", async () => {
    const html = await (await get('/tools/ip-lookup?ip="><script>x</script>')).text();
    expect(html).not.toContain("<script>x");
  });

  it("rate limits repeated lookups from the same address", async () => {
    const headers = { "cf-connecting-ip": "203.0.113.9" };
    let lastText = "";
    for (let i = 0; i < 31; i++) {
      lastText = await (await get("/tools/ip-lookup?ip=8.8.8.8", headers)).text();
    }
    expect(lastText).toContain("Too many lookups from your address");
  });

  it("meters the anonymous bucket more tightly than a known address", async () => {
    let lastText = "";
    for (let i = 0; i < 16; i++) {
      lastText = await (await get("/tools/ip-lookup?ip=8.8.8.8")).text();
    }
    expect(lastText).toContain("Too many lookups from your address");
  });
});
