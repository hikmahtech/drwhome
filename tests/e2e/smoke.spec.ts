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
  await expect(page.locator("pre").first()).toContainText("aGVsbG8=");

  await page.getByRole("button", { name: "decode" }).click();
  await page.getByLabel("input").fill("aGVsbG8=");
  await expect(page.locator("pre").first()).toContainText("hello");
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

test("home lists all 10 tools", async ({ page }) => {
  await page.goto("/");
  for (const slug of [
    "ip",
    "ip-lookup",
    "user-agent",
    "headers",
    "dns",
    "json",
    "base64",
    "url-codec",
    "jwt",
    "uuid",
  ]) {
    await expect(page.locator(`a[href="/tools/${slug}"]`)).toBeVisible();
  }
});

test("json formatter formats valid input", async ({ page }) => {
  await page.goto("/tools/json");
  await page.getByLabel("input").fill('{"a":1}');
  await expect(page.locator("pre").first()).toContainText('"a": 1');
});

test("url codec round-trips", async ({ page }) => {
  await page.goto("/tools/url-codec");
  await page.getByLabel("input").fill("hello world");
  await expect(page.locator("pre").first()).toContainText("hello%20world");
});

test("uuid generator produces a v4 uuid", async ({ page }) => {
  await page.goto("/tools/uuid");
  await page.getByRole("button", { name: "generate" }).click();
  await expect(page.locator("pre").first()).toHaveText(
    /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/,
  );
});

test("jwt decoder shows header and payload for a valid token", async ({ page }) => {
  await page.goto("/tools/jwt");
  await page.getByLabel("token").fill("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig");
  await expect(page.locator("pre").first()).toContainText("HS256");
  await expect(page.locator("pre").nth(1)).toContainText('"sub": "1"');
});

test("user agent tool parses navigator.userAgent", async ({ page }) => {
  await page.goto("/tools/user-agent");
  await expect(page.getByLabel("user agent")).not.toHaveValue("");
});
