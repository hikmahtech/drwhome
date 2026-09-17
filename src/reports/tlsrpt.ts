import type { TlsrptCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function tlsrptRows({ raw, ruaUris }: TlsrptCheckData): Row[] {
  return [
    { label: "Record", value: raw },
    {
      label: "Reports go to",
      value: ruaUris.length > 0 ? ruaUris.join("\n") : "nowhere — no rua= address",
      note: "Where a mail server tells you it failed to deliver over an encrypted connection.",
    },
  ];
}
