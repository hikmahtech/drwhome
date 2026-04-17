import { expect, test } from "@playwright/test";

test("sitemap.xml lists tool and blog pages", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("/tools/base64");
  expect(body).toContain("/tools/dns");
  expect(body).toContain("/blog/decode-jwt-without-verifying");
});

test("robots.txt allows all and points at sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/User-Agent: \*/i);
  expect(body).toMatch(/Sitemap:.*\/sitemap\.xml/i);
});

test("llms.txt summarises site and lists all tools", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const body = await res.text();
  expect(body).toMatch(/^# drwho\.me/m);
  expect(body).toContain("/tools/base64");
  expect(body).toContain("/tools/jwt");
  expect(body).toContain("/mcp/mcp");
});

test("tool page has SoftwareApplication JSON-LD", async ({ page }) => {
  await page.goto("/tools/jwt");
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(json).toBeTruthy();
  const parsed = JSON.parse(json ?? "{}");
  expect(parsed["@type"]).toBe("SoftwareApplication");
  expect(parsed.name).toBe("jwt decoder");
});

test("enriched tool page renders overview, how-to, faq sections and multiple JSON-LD", async ({
  page,
}) => {
  await page.goto("/tools/jwt");
  await expect(page.getByText("## overview")).toBeVisible();
  await expect(page.getByText("## how to use")).toBeVisible();
  await expect(page.getByText("## faq")).toBeVisible();
  await expect(page.getByText("## references")).toBeVisible();
  // 4 JSON-LD blocks on an enriched page: SoftwareApplication + BreadcrumbList + FAQPage + HowTo
  const scripts = await page.locator('script[type="application/ld+json"]').count();
  expect(scripts).toBe(4);
});

test("blog post page has BlogPosting JSON-LD", async ({ page }) => {
  await page.goto("/blog/decode-jwt-without-verifying");
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const parsed = JSON.parse(json ?? "{}");
  expect(parsed["@type"]).toBe("BlogPosting");
  expect(parsed.headline).toContain("JWT");
});

test("home page has WebSite JSON-LD", async ({ page }) => {
  await page.goto("/");
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const parsed = JSON.parse(json ?? "{}");
  expect(parsed["@type"]).toBe("WebSite");
});

test("blog index page renders all 5 launch posts", async ({ page }) => {
  await page.goto("/blog");
  for (const slug of [
    "decode-jwt-without-verifying",
    "uuidv4-vs-uuidv7",
    "reading-ip-from-vercel-edge-headers",
    "dns-over-https-cloudflare-primer",
    "base64-isnt-encryption",
  ]) {
    await expect(page.locator(`a[href="/blog/${slug}"]`)).toBeVisible();
  }
});

test("blog post renders MDX with a rendered code block", async ({ page }) => {
  await page.goto("/blog/decode-jwt-without-verifying");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/JWT/i);
  await expect(page.locator("pre").first()).toBeVisible();
});

test("OG image endpoints respond with image/png", async ({ request }) => {
  for (const path of [
    "/opengraph-image",
    "/tools/base64/opengraph-image",
    "/blog/decode-jwt-without-verifying/opengraph-image",
  ]) {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});

test("tool page has canonical + og:image meta", async ({ page }) => {
  await page.goto("/tools/dns");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toContain("/tools/dns");
  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(ogImage).toBeTruthy();
});
