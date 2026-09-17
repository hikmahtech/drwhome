export default function SpfGeneratorForm() {
  return (
    <dw-live tool="spf-record-generator">
      <form class="sheet">
        <label class="tick">
          <input type="checkbox" name="a" /> Authorize this domain's A/AAAA records (a)
        </label>
        <label class="tick">
          <input type="checkbox" name="mx" checked /> Authorize this domain's mail servers (mx)
        </label>
        <label class="field">
          <span class="label">include: mechanisms (space or comma separated)</span>
          <input
            type="text"
            name="includes"
            value="_spf.google.com"
            spellcheck={false}
            autocomplete="off"
          />
        </label>
        <label class="field">
          <span class="label">IPv4 addresses or CIDRs</span>
          <input
            type="text"
            name="ip4"
            spellcheck={false}
            autocomplete="off"
            placeholder="192.0.2.10 198.51.100.0/24"
          />
        </label>
        <label class="field">
          <span class="label">IPv6 addresses or CIDRs</span>
          <input
            type="text"
            name="ip6"
            spellcheck={false}
            autocomplete="off"
            placeholder="2001:db8::/32"
          />
        </label>
        <fieldset class="seg">
          <legend class="label">All mechanism</legend>
          <label>
            <input type="radio" name="all" value="-all" checked /> -all (hardfail)
          </label>
          <label>
            <input type="radio" name="all" value="~all" /> ~all (softfail)
          </label>
          <label>
            <input type="radio" name="all" value="?all" /> ?all (neutral)
          </label>
          <label>
            <input type="radio" name="all" value="+all" /> +all (pass all)
          </label>
        </fieldset>
      </form>
      <span class="label out-label">Result</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
