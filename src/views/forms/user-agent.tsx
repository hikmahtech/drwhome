export default function UserAgentForm() {
  return (
    <dw-live tool="user-agent">
      <form class="sheet">
        <label class="field">
          <span class="label">User agent string</span>
          <textarea name="input" rows={3} spellcheck={false} autocomplete="off" />
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
