import { formatJson } from "../lib/json";
import { defineLive } from "./_live";

defineLive((f) => {
  const input = String(f.get("input") ?? "");
  if (input.trim() === "") return null;
  const indent = Number(f.get("indent") ?? 2) as 0 | 2 | 4;
  const r = formatJson(input, indent);
  return r.ok ? { text: r.value } : { error: r.error };
});
