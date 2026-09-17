import { describe, expect, it } from "vitest";
import type { BlacklistResult } from "../../src/lib/blacklist";
import { blacklistReport } from "../../src/reports/blacklist";
import type { Row } from "../../src/reports/report";

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

const clean = (list: string) => ({
  list,
  listId: list.toLowerCase(),
  status: "clean" as const,
  codes: [],
});
const listed = (list: string) => ({
  list,
  listId: list.toLowerCase(),
  status: "listed" as const,
  codes: ["127.0.0.2"],
});
const unavailable = (list: string) => ({
  list,
  listId: list.toLowerCase(),
  status: "unavailable" as const,
  codes: [],
});

describe("blacklist report", () => {
  it("is good and names the blocklist count when nothing is listed", () => {
    const r: BlacklistResult = {
      ok: true,
      domain: "example.com",
      checkedLists: 6,
      listedIps: 0,
      ips: [{ ip: "1.2.3.4", source: "web", listedOn: 0, listings: [clean("Barracuda")] }],
    };
    const report = blacklistReport(r);
    expect(report.tone).toBe("good");
    expect(report.verdict).toBe("Not listed on any of 6 blocklists");
    expect(row(report.rows, "1.2.3.4 (web)")?.value).toBe("clean");
    expect(row(report.rows, "1.2.3.4 (web)")?.tone).toBe("good");
  });

  it("is bad and names the distinct blocklists when something is listed", () => {
    const r: BlacklistResult = {
      ok: true,
      domain: "example.com",
      checkedLists: 6,
      listedIps: 1,
      ips: [
        {
          ip: "1.2.3.4",
          source: "web",
          listedOn: 1,
          listings: [listed("Barracuda"), clean("SpamCop")],
        },
      ],
    };
    const report = blacklistReport(r);
    expect(report.tone).toBe("bad");
    expect(report.verdict).toBe("Listed on 1 blocklist(s)");
    expect(row(report.rows, "1.2.3.4 (web)")?.value).toBe("Barracuda");
    expect(row(report.rows, "1.2.3.4 (web)")?.tone).toBe("bad");
  });

  it("warns, instead of claiming clean, when lists could not be queried", () => {
    const r: BlacklistResult = {
      ok: true,
      domain: "example.com",
      checkedLists: 6,
      listedIps: 0,
      ips: [{ ip: "1.2.3.4", source: "web", listedOn: 0, listings: [unavailable("Barracuda")] }],
    };
    const report = blacklistReport(r);
    expect(report.tone).toBe("warn");
    expect(report.verdict).toContain("could not be queried");
    expect(row(report.rows, "1.2.3.4 (web)")?.tone).toBe("warn");
  });

  it("reports no A/MX records as a warn absence, not an error", () => {
    const report = blacklistReport({
      ok: false,
      error: "no A or MX records resolved for this domain",
    });
    expect(report.tone).toBe("warn");
    expect(report.rows).toEqual([]);
  });

  it("reports an invalid domain as a bad failure, never as an absence", () => {
    const report = blacklistReport({ ok: false, error: "invalid domain" });
    expect(report.tone).toBe("bad");
    expect(report.verdict).toContain("Could not check");
  });
});
