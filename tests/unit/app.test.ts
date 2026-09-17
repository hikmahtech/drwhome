import { describe, expect, it } from "vitest";
import { app } from "../../src/app";

const get = (path: string, init?: RequestInit) => app.request(`http://drwho.me${path}`, init);

describe("pages", () => {
  it("serves the home page and a built tool", async () => {
    expect((await get("/")).status).toBe(200);
    const res = await get("/tools/spf-checker?domain=Example.COM.");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('value="example.com"');
  });

  it("does not echo an invalid domain back into the page", async () => {
    const html = await (await get('/tools/spf-checker?domain="><script>x</script>')).text();
    expect(html).not.toContain("<script>x");
  });

  it("sends a strict content security policy", async () => {
    const csp = (await get("/")).headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'none'");
    expect(csp).not.toContain("unsafe");
  });
});

describe("canonical host", () => {
  const www = (path: string, init?: RequestInit) =>
    app.request(`http://www.drwho.me${path}`, { ...init, headers: { host: "www.drwho.me" } });

  it("sends www to the apex with path and query", async () => {
    const res = await www("/tools/spf-checker?domain=example.com");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(
      "https://drwho.me/tools/spf-checker?domain=example.com",
    );
  });

  it("keeps the method for an MCP client pointed at www", async () => {
    expect((await www("/mcp/mcp", { method: "POST" })).status).toBe(308);
  });

  it("leaves the apex and other hosts alone", async () => {
    expect((await get("/")).status).toBe(200);
  });
});

describe("response headers", () => {
  it("sends a permissions policy that turns off what the site does not use", async () => {
    const pp = (await get("/")).headers.get("permissions-policy") ?? "";
    expect(pp).toContain("camera=()");
    expect(pp).toContain("geolocation=()");
  });
});

describe("legacy paths still reach Domain Posture", () => {
  // Signed evidence packs and invoice emails already issued carry these drwho.me URLs.
  const cases = [
    "/verify/abc123",
    "/orders/o_1?token=hmac123",
    "/scripts/verify-pack.mjs",
    "/.well-known/evidence-pack-pubkey.pem",
    "/methodology/v1",
    "/d/example.com",
    "/blog/some-post",
    "/api/orders/1/pack/report.pdf",
    // An old Domain Posture slug this site never serves.
    "/tools/dossier-dns",
  ];
  for (const path of cases) {
    it(`308 ${path}`, async () => {
      const res = await get(path);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe(`https://www.domainposture.com${path}`);
    });
  }

  it("keeps the method-preserving 308 for POST", async () => {
    expect((await get("/api/orders/1", { method: "POST" })).status).toBe(308);
  });
});

describe("/go", () => {
  it("tags the link and carries the domain", async () => {
    const res = await get("/go/report?domain=example.com&from=spf-checker");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://www.domainposture.com/d/example.com?utm_source=drwho.me&utm_medium=tool&utm_campaign=spf-checker",
    );
  });

  it("is not an open redirect", async () => {
    for (const bad of ["evil.com/x", "https://evil.com", "evil.com@x", "//evil.com"]) {
      const loc = (await get(`/go/report?domain=${encodeURIComponent(bad)}`)).headers.get(
        "location",
      );
      expect(new URL(loc ?? "").origin).toBe("https://www.domainposture.com");
      expect(loc).not.toContain("evil");
    }
  });

  it("rejects an unknown target", async () => {
    // /go is ours, so an unknown target is a plain 404, never a guessed destination.
    expect((await get("/go/nowhere")).status).toBe(404);
  });
});
