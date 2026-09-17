import type { LlmsTxtCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function llmsTxtRows(d: LlmsTxtCheckData): Row[] {
  return [
    { label: "Title", value: d.firstLine.replace(/^#+\s*/, "") || "(blank heading)" },
    { label: "Size", value: `${d.bytes} bytes` },
  ];
}
