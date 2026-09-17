export default function JsonForm() {
  return (
    <dw-live tool="json">
      <form class="sheet">
        <label class="field">
          <span class="label">Input</span>
          <textarea name="input" rows={10} spellcheck={false} autocomplete="off" />
        </label>
        <fieldset class="seg">
          <legend class="label">Indent</legend>
          <label>
            <input type="radio" name="indent" value="2" checked /> 2 spaces
          </label>
          <label>
            <input type="radio" name="indent" value="4" /> 4 spaces
          </label>
          <label>
            <input type="radio" name="indent" value="0" /> Minify
          </label>
        </fieldset>
      </form>
      <span class="label out-label">Output</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
