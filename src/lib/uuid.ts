/** Random UUID, version 4. */
export function uuidV4(): string {
  return crypto.randomUUID();
}

/**
 * UUID version 7: a 48-bit millisecond timestamp, the version nibble, the variant bits, and
 * the rest random. Sorting v7 values as strings sorts them by creation time.
 */
export function uuidV7(now: number = Date.now()): string {
  const tsHex = Math.floor(now).toString(16).padStart(12, "0");
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  rand[0] = (rand[0] & 0x0f) | 0x70; // version 7
  rand[2] = (rand[2] & 0x3f) | 0x80; // variant 10
  const hex = (b: number) => b.toString(16).padStart(2, "0");
  return [
    tsHex.slice(0, 8),
    tsHex.slice(8, 12),
    hex(rand[0]) + hex(rand[1]),
    hex(rand[2]) + hex(rand[3]),
    Array.from(rand.slice(4), hex).join(""),
  ].join("-");
}
