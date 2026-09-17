export type JsonResult = { ok: true; value: string } | { ok: false; error: string };

/** Formats or minifies JSON. indent 0 minifies; 2 and 4 pretty-print. */
export function formatJson(input: string, indent: 0 | 2 | 4 = 2): JsonResult {
  if (input.trim() === "") return { ok: false, error: "Enter some JSON to format." };
  try {
    const parsed = JSON.parse(input);
    return {
      ok: true,
      value: indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "This is not valid JSON." };
  }
}
