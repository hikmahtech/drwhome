export default function JwtForm() {
  return (
    <dw-live tool="jwt">
      <form class="sheet">
        <label class="field">
          <span class="label">Token</span>
          <textarea
            name="input"
            rows={6}
            spellcheck={false}
            autocomplete="off"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />
        </label>
      </form>
      <span class="label out-label">Decoded</span>
      <div data-out aria-live="polite" />
      <noscript>
        <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
      </noscript>
    </dw-live>
  );
}
