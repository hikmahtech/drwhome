export default function Base64Form() {
  return (
    <dw-live tool="base64">
      <form class="sheet">
        <fieldset class="seg">
          <legend class="label">Direction</legend>
          <label>
            <input type="radio" name="mode" value="encode" checked /> Encode
          </label>
          <label>
            <input type="radio" name="mode" value="decode" /> Decode
          </label>
        </fieldset>
        <label class="field">
          <span class="label">Input</span>
          <textarea name="input" rows={6} spellcheck={false} autocomplete="off" />
        </label>
        <label class="tick">
          <input type="checkbox" name="urlsafe" /> URL-safe output: - and _ in place of + and /, no
          padding
        </label>
      </form>
      <span class="label out-label">Output</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
