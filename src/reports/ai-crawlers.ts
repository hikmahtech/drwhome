import { AI_CRAWLERS, type AiCrawlerPolicyData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function aiCrawlerRows(d: AiCrawlerPolicyData): Row[] {
  const rows: Row[] = [{ label: "robots.txt", value: d.hasRobots ? "present" : "not found" }];
  for (const agent of AI_CRAWLERS) {
    const stance = d.agents[agent] ?? "unspecified";
    rows.push({
      label: agent,
      value: stance,
      tone: stance === "blocked" ? "warn" : stance === "allowed" ? "good" : "plain",
    });
  }
  return rows;
}
