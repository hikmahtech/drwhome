export default function DmarcGeneratorForm() {
  return (
    <dw-live tool="dmarc-record-generator">
      <form class="sheet">
        <label class="field">
          <span class="label">Domain (just to show the DNS name)</span>
          <input
            type="text"
            name="domain"
            spellcheck={false}
            autocomplete="off"
            autocapitalize="none"
            placeholder="example.com"
          />
        </label>
        <label class="field">
          <span class="label">Policy (p)</span>
          <select name="policy">
            <option value="none">none</option>
            <option value="quarantine">quarantine</option>
            <option value="reject">reject</option>
          </select>
        </label>
        <label class="field">
          <span class="label">Subdomain policy (sp) — optional</span>
          <select name="sp">
            <option value="">inherit p</option>
            <option value="none">none</option>
            <option value="quarantine">quarantine</option>
            <option value="reject">reject</option>
          </select>
        </label>
        <label class="field">
          <span class="label">Aggregate reports (rua)</span>
          <input
            type="text"
            name="rua"
            spellcheck={false}
            autocomplete="off"
            placeholder="dmarc@example.com"
          />
        </label>
        <label class="field">
          <span class="label">Forensic reports (ruf) — optional</span>
          <input
            type="text"
            name="ruf"
            spellcheck={false}
            autocomplete="off"
            placeholder="forensics@example.com"
          />
        </label>
        <label class="field">
          <span class="label">Apply to % of mail (pct) — optional</span>
          <input
            type="text"
            name="pct"
            inputmode="numeric"
            spellcheck={false}
            autocomplete="off"
            placeholder="100"
          />
        </label>
        <label class="tick">
          <input type="checkbox" name="adkim" /> Strict DKIM alignment
        </label>
        <label class="tick">
          <input type="checkbox" name="aspf" /> Strict SPF alignment
        </label>
      </form>
      <span class="label out-label">Result</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
