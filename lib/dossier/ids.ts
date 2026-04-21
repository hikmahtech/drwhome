// lib/dossier/ids.ts
export type DossierCheckId =
  | "dns"
  | "mx"
  | "spf"
  | "dmarc"
  | "dkim"
  | "tls"
  | "redirects"
  | "headers"
  | "cors"
  | "web-surface";

export const dossierCheckIds: readonly DossierCheckId[] = [
  "dns",
  "mx",
  "spf",
  "dmarc",
  "dkim",
  "tls",
  "redirects",
  "headers",
  "cors",
  "web-surface",
];
