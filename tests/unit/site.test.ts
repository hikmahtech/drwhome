import { describe, expect, it } from "vitest";
import { isReady } from "../../src/content/ready";
import { tools } from "../../src/content/tools";
import { OWNED_PATHS, site } from "../../src/routes/site";
import { Mcp } from "../../src/views/site/Mcp";

const get = (path: string, init?: RequestInit) => site.request(`http://drwho.me${path}`, init);

/** No full XML parser in this project. Good enough for output we generate ourselves: every
 *  opening tag must have a matching closing tag, in order. */
function assertWellFormedXml(xml: string) {
  const stack: string[] = [];
  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec-loop idiom
  while ((m = tagRe.exec(xml))) {
    const [, closing, name, selfClose] = m;
    if (selfClose === "/") continue;
    if (closing === "/") expect(stack.pop()).toBe(name);
    else stack.push(name);
  }
  expect(stack).toEqual([]);
}

const PAGES: [string, string][] = [
  ["/tools", "All tools"],
  ["/mcp", "Use these tools from an AI agent"],
  ["/monitoring", "Scheduled monitoring and evidence packs"],
  ["/about", "About drwho.me"],
  ["/privacy", "Privacy"],
];

describe("pages", () => {
  for (const [path, h1] of PAGES) {
    it(`serves ${path}`, async () => {
      const res = await get(path);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain(`<h1>${h1}</h1>`);
    });
  }

  it("never links straight to domainposture.com; every such link goes through /go/", async () => {
    for (const [path] of PAGES) {
      const html = await (await get(path)).text();
      expect(html).not.toContain('href="https://www.domainposture.com');
      expect(html).not.toContain('href="https://domainposture.com');
    }
  });
});

describe("/mcp", () => {
  // The route's dynamic import of src/mcp/tools.ts depends on whether that (another agent's)
  // file exists in this checkout, so the two data states are tested against the view directly
  // rather than against whatever the route happens to resolve right now.
  it("renders a placeholder when the tool list is null", () => {
    const html = String(Mcp({ mcpTools: null }));
    expect(html).toContain("The tool list will appear here.");
  });

  it("renders the tool table, first sentence only, when a list is given", () => {
    const html = String(
      Mcp({
        mcpTools: [
          { name: "SPF checker", description: "Find and read a domain's SPF record. More detail." },
          { name: "DNS lookup", description: "Resolve one record type.", slug: "dns" },
        ],
      }),
    );
    expect(html).toContain("SPF checker");
    expect(html).toContain("Find and read a domain");
    expect(html).not.toContain("More detail");
    expect(html).toContain('href="/tools/dns"');
    expect(html).not.toContain("The tool list will appear here.");
  });

  it("always renders the endpoint details, regardless of the tool list", async () => {
    const html = await (await get("/mcp")).text();
    expect(html).toContain("https://drwho.me/mcp/mcp");
    expect(html).toContain("claude mcp add --transport http drwho");
  });
});

describe("/robots.txt", () => {
  it("allows everything except /go/ and /api/, and points at the sitemap", async () => {
    const res = await get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /go/");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap: https://drwho.me/sitemap.xml");
  });
});

describe("/sitemap.xml", () => {
  it("is well-formed and uses the sitemap namespace", async () => {
    const res = await get("/sitemap.xml");
    expect(res.status).toBe(200);
    const xml = await res.text();
    assertWellFormedXml(xml);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it("lists exactly the ready tools, generated from the tool list", async () => {
    const xml = await (await get("/sitemap.xml")).text();
    for (const t of tools.filter(isReady)) {
      expect(xml).toContain(`<loc>https://drwho.me/tools/${t.slug}</loc>`);
    }
    for (const t of tools.filter((x) => !isReady(x))) {
      expect(xml).not.toContain(`/tools/${t.slug}<`);
    }
  });

  it("lists the fixed site pages", async () => {
    const xml = await (await get("/sitemap.xml")).text();
    for (const p of [
      "/",
      "/tools",
      "/mcp",
      "/domain-report",
      "/monitoring",
      "/about",
      "/privacy",
    ]) {
      expect(xml).toContain(`<loc>https://drwho.me${p}</loc>`);
    }
  });
});

describe("/llms.txt", () => {
  it("starts with an H1 heading and is served as plain text", async () => {
    const res = await get("/llms.txt");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    const body = await res.text();
    expect(body.startsWith("# drwho.me")).toBe(true);
    expect(body).toContain("https://drwho.me/mcp/mcp");
  });
});

describe("OWNED_PATHS", () => {
  it("every owned path resolves inside this router, not the legacy 308", async () => {
    for (const path of OWNED_PATHS) {
      const res = await get(path);
      expect(res.status).not.toBe(308);
      expect(res.status).not.toBe(404);
    }
  });
});
