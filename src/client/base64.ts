import { decodeBase64, encodeBase64 } from "../lib/base64";
import { defineLive } from "./_live";

defineLive((f) => {
  const input = String(f.get("input") ?? "");
  if (input === "") return null;
  if (f.get("mode") === "decode") {
    const r = decodeBase64(input);
    return r.ok ? { text: r.value } : { error: r.error };
  }
  return { text: encodeBase64(input, { urlSafe: f.get("urlsafe") === "on" }) };
});
