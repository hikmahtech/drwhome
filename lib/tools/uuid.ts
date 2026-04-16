export type UuidVersion = "v4" | "v7";

export function generateUuid(version: UuidVersion): string {
  if (version === "v4") return crypto.randomUUID();
  return generateV7();
}

function generateV7(): string {
  const ts = Date.now();
  const tsHex = ts.toString(16).padStart(12, "0");
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  rand[0] = (rand[0] & 0x0f) | 0x70;
  rand[2] = (rand[2] & 0x3f) | 0x80;
  const hex = (b: number) => b.toString(16).padStart(2, "0");
  return [
    tsHex.slice(0, 8),
    tsHex.slice(8, 12),
    hex(rand[0]) + hex(rand[1]),
    hex(rand[2]) + hex(rand[3]),
    rand.slice(4).reduce((s, b) => s + hex(b), ""),
  ].join("-");
}
