import { decodeUrl, encodeUrl } from "../lib/url";
import { defineLive } from "./_live";

defineLive((f) => {
  const input = String(f.get("input") ?? "");
  if (input === "") return null;
  if (f.get("mode") === "decode") {
    const r = decodeUrl(input);
    return r.ok ? { text: r.value } : { error: r.error };
  }
  return { text: encodeUrl(input) };
});
