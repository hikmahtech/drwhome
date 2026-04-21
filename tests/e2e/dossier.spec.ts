import { expect, test } from "@playwright/test";

test.describe("domain dossier", () => {
  test("renders DNS section for example.com", async ({ page }) => {
    await page.goto("/d/example.com");
    // Section loads with id="dns" - use nth to get the rendered one (not the skeleton)
    const dnsSection = page.locator("#dns").last();
    await expect(dnsSection).toBeVisible({ timeout: 15_000 });
    // Terminal state: ok / error / not_applicable / timeout — any is acceptable for a real network call.
    await expect(dnsSection).toContainText(/\b(ok|error|timeout|not_applicable)\b/);
  });

  test("invalid domain returns not-found body", async ({ page }) => {
    await page.goto("/d/not..valid");
    // Next.js renders not-found.tsx with 200 status, not 404
    await expect(page.getByText(/not a valid public domain/i)).toBeVisible();
  });

  test("standalone /tools/dossier-dns accepts ?domain=", async ({ page }) => {
    await page.goto("/tools/dossier-dns?domain=example.com");
    const dnsSection = page.locator("#dns").last();
    await expect(dnsSection).toBeVisible({ timeout: 15_000 });
  });
});
