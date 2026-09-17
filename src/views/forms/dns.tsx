import { DNS_TYPES } from "../../lib/dns";

export default function DnsForm() {
  return (
    <dw-live tool="dns" on="submit">
      <form class="sheet">
        <label class="field">
          <span class="label">Domain name</span>
          <input
            type="text"
            name="name"
            inputmode="url"
            autocomplete="off"
            autocapitalize="none"
            spellcheck={false}
            placeholder="example.com"
            required
          />
        </label>
        <label class="field">
          <span class="label">Record type</span>
          <select name="type">
            {DNS_TYPES.map((t) => (
              <option value={t} selected={t === "A"}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" class="btn">
          Look up
        </button>
      </form>
      <span class="label out-label">Result</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
