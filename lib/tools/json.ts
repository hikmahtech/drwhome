export type JsonResult = { ok: true; value: string } | { ok: false; error: string };

export function formatJson(input: string, indent = 2): JsonResult {
  if (input.trim() === "") return { ok: false, error: "empty input" };
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, indent) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "invalid JSON" };
  }
}
