export default function UuidForm() {
  return (
    <dw-live tool="uuid">
      <form class="sheet">
        <fieldset class="seg">
          <legend class="label">Version</legend>
          <label>
            <input type="radio" name="version" value="v4" checked /> v4 (random)
          </label>
          <label>
            <input type="radio" name="version" value="v7" /> v7 (time-ordered)
          </label>
        </fieldset>
        <label class="field">
          <span class="label">How many</span>
          <select name="count">
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </label>
        <button type="button" class="btn" data-again>
          Generate again
        </button>
      </form>
      <span class="label out-label">Output</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
