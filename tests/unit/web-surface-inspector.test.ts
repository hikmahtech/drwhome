import type { CheckResult, WebSurfaceData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { gradedReport } from "../../src/reports/report";
import { webSurfaceRows } from "../../src/reports/web-surface";

const report = (result: CheckResult<WebSurfaceData>) =>
  gradedReport("web-surface", result, "example.com", webSurfaceRows);

const ok = (over: Partial<WebSurfaceData> = {}) =>
  report({
    status: "ok",
    data: {
      robots: { present: true, body: "User-agent: *\nDisallow:" },
      sitemap: { present: true, urlCount: 12 },
      head: {
        title: "Example",
        description: "An example site",
        og: { "og:title": "Example" },
        twitter: { "twitter:card": "summary" },
      },
      ...over,
    },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: ReturnType<typeof webSurfaceRows>, label: string) =>
  rows.find((x) => x.label === label);

describe("Web surface report", () => {
  it("is always informational — no security penalty", () => {
    expect(ok().tone).toBe("good");
    expect(ok({ robots: { present: false }, sitemap: { present: false } }).tone).toBe("good");
  });

  it("shows title, description, robots and sitemap presence", () => {
    const r = ok();
    expect(row(r.rows, "Title")?.value).toBe("Example");
    expect(row(r.rows, "Description")?.value).toBe("An example site");
    expect(row(r.rows, "robots.txt")?.value).toBe("present");
    expect(row(r.rows, "sitemap.xml")?.value).toBe("present (12 URLs)");
  });

  it("reports missing robots/sitemap/metadata plainly, not as findings", () => {
    const r = ok({
      robots: { present: false },
      sitemap: { present: false },
      head: { og: {}, twitter: {} },
    });
    expect(row(r.rows, "robots.txt")?.value).toBe("not found");
    expect(row(r.rows, "sitemap.xml")?.value).toBe("not found");
    expect(row(r.rows, "Title")?.value).toBe("not set");
  });

  it("groups OpenGraph and Twitter tags into one row each", () => {
    const r = ok({
      head: {
        og: { "og:title": "Example", "og:image": "https://example.com/img.png" },
        twitter: { "twitter:card": "summary" },
      },
    });
    expect(row(r.rows, "OpenGraph tags (2)")?.value).toBe(
      "og:title: Example\nog:image: https://example.com/img.png",
    );
    expect(row(r.rows, "Twitter tags (1)")?.value).toBe("twitter:card: summary");
  });

  it("grades an unreachable home page but never an error or timeout", () => {
    expect(report({ status: "error", message: "connect refused" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
