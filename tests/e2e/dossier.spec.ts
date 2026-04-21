import { expect, test } from "@playwright/test";

const SECTION_IDS = [
  "dns",
  "mx",
  "spf",
  "dmarc",
  "dkim",
  "tls",
  "redirects",
  "headers",
  "cors",
  "web-surface",
] as const;

test.describe("domain dossier", () => {
  test("all 10 sections reach a terminal state for example.com", async ({ page }) => {
    await page.goto("/d/example.com");
    for (const id of SECTION_IDS) {
      // Streaming can produce two elements with the same id (fallback + resolved).
      // .last() targets the resolved one.
      await expect(page.locator(`#${id}`).last()).toContainText(
        /\b(ok|error|timeout|not_applicable)\b/,
        { timeout: 20_000 },
      );
    }
  });

  test("invalid domain renders the not-found body", async ({ page }) => {
    // Note: Next.js 15 App Router dynamic streaming routes return HTTP 200 when notFound()
    // fires because headers have already flushed. Assert on body text instead of status.
    await page.goto("/d/not..valid");
    await expect(page.getByText(/not a valid public domain/i)).toBeVisible();
  });

  test("standalone /tools/dossier-dns accepts ?domain=", async ({ page }) => {
    await page.goto("/tools/dossier-dns?domain=example.com");
    await expect(page.locator("#dns").last()).toBeVisible({ timeout: 15_000 });
  });

  test("standalone /tools/dossier-mx accepts ?domain=", async ({ page }) => {
    await page.goto("/tools/dossier-mx?domain=gmail.com");
    await expect(page.locator("#mx").last()).toContainText(
      /\b(ok|error|timeout|not_applicable)\b/,
      { timeout: 15_000 },
    );
  });
});
