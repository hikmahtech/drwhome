// Pure DMARC record builder. Turns form inputs into a valid `v=DMARC1` TXT record and surfaces
// the mistakes people actually make (jumping to p=reject, no rua address, etc). No network —
// this is string logic only.

export type DmarcPolicy = "none" | "quarantine" | "reject";
export type DmarcAlignment = "r" | "s";

export type DmarcInput = {
  policy: DmarcPolicy;
  /** Subdomain policy (sp). Empty = inherit p. */
  subdomainPolicy?: DmarcPolicy | "";
  /** Aggregate report addresses, comma/space separated. */
  rua?: string;
  /** Forensic report addresses, comma/space separated. */
  ruf?: string;
  /** Percentage of mail the policy applies to (1-100). */
  pct?: number;
  aspf?: DmarcAlignment;
  adkim?: DmarcAlignment;
};

export type DmarcOutput = { record: string; warnings: string[] };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function mailtoList(raw: string | undefined): { tags: string; bad: string[] } {
  if (!raw) return { tags: "", bad: [] };
  const parts = raw
    .split(/[,\s]+/)
    .map((s) => s.trim().replace(/^mailto:/i, ""))
    .filter(Boolean);
  const good: string[] = [];
  const bad: string[] = [];
  for (const p of parts) (EMAIL.test(p) ? good : bad).push(p);
  return { tags: good.map((e) => `mailto:${e}`).join(","), bad };
}

export function buildDmarcRecord(input: DmarcInput): DmarcOutput {
  const warnings: string[] = [];
  const tags: string[] = ["v=DMARC1", `p=${input.policy}`];

  if (input.subdomainPolicy) tags.push(`sp=${input.subdomainPolicy}`);

  const rua = mailtoList(input.rua);
  const ruf = mailtoList(input.ruf);
  if (rua.tags) tags.push(`rua=${rua.tags}`);
  if (ruf.tags) tags.push(`ruf=${ruf.tags}`);
  for (const b of [...rua.bad, ...ruf.bad]) warnings.push(`ignored invalid report address: ${b}`);

  const pct = input.pct;
  if (typeof pct === "number" && pct >= 1 && pct <= 99) tags.push(`pct=${Math.round(pct)}`);

  if (input.adkim === "s") tags.push("adkim=s");
  if (input.aspf === "s") tags.push("aspf=s");

  // Advisory warnings — the mistakes people make.
  if (input.policy === "none") {
    warnings.push(
      "p=none is monitoring only — it provides no protection. Move to quarantine, then reject, once your reports look clean.",
    );
  }
  if (input.policy === "reject") {
    warnings.push(
      "p=reject drops failing mail outright. Run p=none or p=quarantine first and read your rua reports, or you may lose legitimate email.",
    );
  }
  if (!rua.tags) {
    warnings.push(
      "No rua address — you won't receive aggregate reports, so you can't see what fails DMARC.",
    );
  }

  return { record: tags.join("; "), warnings };
}
