import type { Report } from "../reports/report";

/**
 * One domain check, as the site, the API and the MCP server all see it.
 * `id` is the tool slug. `run` does the lookup and returns the report in one step.
 */
export type DomainCheck = {
  id: string;
  run: (domain: string) => Promise<Report>;
};
