import type { WebSurfaceData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function webSurfaceRows(d: WebSurfaceData): Row[] {
  const rows: Row[] = [
    { label: "Title", value: d.head.title ?? "not set" },
    { label: "Description", value: d.head.description ?? "not set" },
    {
      label: "robots.txt",
      value: d.robots.present ? "present" : "not found",
      tone: d.robots.present ? "good" : "plain",
    },
    {
      label: "sitemap.xml",
      value: d.sitemap.present
        ? `present${d.sitemap.urlCount !== undefined ? ` (${d.sitemap.urlCount} URLs)` : ""}`
        : "not found",
      tone: d.sitemap.present ? "good" : "plain",
    },
  ];

  const og = Object.entries(d.head.og);
  if (og.length > 0) {
    rows.push({
      label: `OpenGraph tags (${og.length})`,
      value: og.map(([k, v]) => `${k}: ${v}`).join("\n"),
    });
  }
  const twitter = Object.entries(d.head.twitter);
  if (twitter.length > 0) {
    rows.push({
      label: `Twitter tags (${twitter.length})`,
      value: twitter.map(([k, v]) => `${k}: ${v}`).join("\n"),
    });
  }
  return rows;
}
