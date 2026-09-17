import type { CheckResult, SpfCheckData } from "@hikmahtech/dossier-checks";
import { describe, expect, it } from "vitest";
import { type Row, gradedReport } from "../../src/reports/report";
import { spfRows } from "../../src/reports/spf";

const report = (result: CheckResult<SpfCheckData>) =>
  gradedReport("spf", result, "example.com", spfRows);

const ok = (record: string, lookalikes?: string[]) =>
  report({
    status: "ok",
    data: { record, mechanisms: record.split(/\s+/), ...(lookalikes ? { lookalikes } : {}) },
    fetchedAt: "2026-09-17T00:00:00Z",
  });

const row = (rows: Row[], label: string) => rows.find((x) => x.label === label);

describe("SPF report", () => {
  it("takes its verdict from Domain Posture's rule", () => {
    expect(ok("v=spf1 include:_spf.google.com -all").tone).toBe("good");
    expect(ok("v=spf1 ~all").tone).toBe("warn");
    expect(ok("v=spf1 +all").tone).toBe("bad");
    expect(ok("v=spf1 all").tone).toBe("bad");
  });

  it("shows the rule's advice as fix rows", () => {
    expect(ok("v=spf1 +all").rows.some((x) => x.label.startsWith("To fix"))).toBe(true);
  });

  it("counts only mechanisms that cost a DNS lookup", () => {
    const r = ok("v=spf1 ip4:1.2.3.4 include:a.com mx a exists:%{i}.x.com redirect=b.com ~all");
    expect(row(r.rows, "DNS lookups")?.value).toBe("5 of 10");
  });

  it("marks more than 10 lookups as bad", () => {
    const many = Array.from({ length: 11 }, (_, i) => `include:s${i}.com`).join(" ");
    expect(row(ok(`v=spf1 ${many} -all`).rows, "DNS lookups")?.tone).toBe("bad");
  });

  it("groups mechanisms and leaves the all mechanism out of the groups", () => {
    const r = ok("v=spf1 ip4:1.2.3.4 include:a.com include:b.com mx ~all");
    expect(row(r.rows, "Includes (2)")?.value).toBe("include:a.com\ninclude:b.com");
    expect(row(r.rows, "Addresses (1)")?.value).toBe("ip4:1.2.3.4");
    expect(row(r.rows, "Other (1)")?.value).toBe("mx");
  });

  it("lists discarded look-alike records", () => {
    const r = ok("v=spf1 -all", ["﻿v=spf1 include:x.com -all"]);
    expect(row(r.rows, "Discarded")?.tone).toBe("bad");
  });

  it("grades a missing record but never an error or a timeout", () => {
    // No SPF at all is a finding about the domain. An error is not.
    expect(report({ status: "not_applicable", reason: "no SPF record" }).tone).toBe("bad");
    expect(report({ status: "error", message: "upstream 500" }).verdict).toContain(
      "Could not check",
    );
    expect(report({ status: "timeout", ms: 5000 }).verdict).toContain("5 seconds");
  });
});
