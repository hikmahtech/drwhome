import { UAParser } from "ua-parser-js";

export type ParsedUserAgent = {
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: { type: string; vendor: string; model: string };
  engine: { name: string };
};

/** Empty strings stand in for anything the string does not say. */
export function parseUserAgent(ua: string): ParsedUserAgent {
  const r = new UAParser(ua).getResult();
  return {
    browser: { name: r.browser.name ?? "", version: r.browser.version ?? "" },
    os: { name: r.os.name ?? "", version: r.os.version ?? "" },
    device: {
      type: r.device.type ?? "",
      vendor: r.device.vendor ?? "",
      model: r.device.model ?? "",
    },
    engine: { name: r.engine.name ?? "" },
  };
}
