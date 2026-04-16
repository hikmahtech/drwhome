import { readFileSync } from "node:fs";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export const OG_COLORS = {
  bg: "#0a0a0a",
  fg: "#d4d4d4",
  muted: "#737373",
  accent: "#4ade80",
  border: "#1f1f1f",
} as const;

export function loadMonoFont(): ArrayBuffer {
  const buf = readFileSync(join(process.cwd(), "public/fonts/JetBrainsMono-Regular.ttf"));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
