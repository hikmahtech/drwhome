import { UAParser } from "ua-parser-js";

export type UaResult = {
  browser: { name?: string; version?: string };
  os: { name?: string; version?: string };
  device: { vendor?: string; model?: string; type?: string };
  engine: { name?: string; version?: string };
};

export function parseUserAgent(ua: string): UaResult {
  const parser = new UAParser(ua);
  const r = parser.getResult();
  return {
    browser: { name: r.browser.name, version: r.browser.version },
    os: { name: r.os.name, version: r.os.version },
    device: { vendor: r.device.vendor, model: r.device.model, type: r.device.type ?? "desktop" },
    engine: { name: r.engine.name, version: r.engine.version },
  };
}
