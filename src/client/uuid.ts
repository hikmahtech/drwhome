import { uuidV4, uuidV7 } from "../lib/uuid";
import { defineLive } from "./_live";

defineLive((f) => {
  const version = f.get("version") === "v7" ? "v7" : "v4";
  const count = Math.min(10, Math.max(1, Number(f.get("count") ?? 1) || 1));
  const gen = version === "v7" ? () => uuidV7() : uuidV4;
  const lines = Array.from({ length: count }, gen);
  return { text: lines.join("\n") };
});
