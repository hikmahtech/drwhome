import { expect, test } from "@playwright/test";

test("home loads and shows base64 tool card", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("drwho.me");
  await expect(page.getByRole("link", { name: /base64/i })).toBeVisible();
});

test("base64 tool encodes and decodes", async ({ page }) => {
  await page.goto("/tools/base64");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("> base64");

  await page.getByLabel("input").fill("hello");
  await expect(page.locator("pre")).toContainText("aGVsbG8=");

  await page.getByRole("button", { name: "decode" }).click();
  await page.getByLabel("input").fill("aGVsbG8=");
  await expect(page.locator("pre")).toContainText("hello");
});

test("theme toggle persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "toggle theme" }).click();
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(["light", "dark"]).toContain(theme);
  await page.reload();
  const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(after).toBe(theme);
});
