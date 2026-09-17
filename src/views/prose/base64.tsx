export default function Base64Prose() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Base64 turns bytes into 64 safe characters, so binary data can travel through systems that
        only handle text. Encoding makes the data about a third larger.
      </p>
      <h2>Base64 is not encryption</h2>
      <p>
        Anyone can decode it, with this page or one line of code. Never treat a base64 string as a
        secret.
      </p>
      <h2>URL-safe base64</h2>
      <p>
        The standard alphabet uses <code>+</code> and <code>/</code>, which have a meaning in URLs.
        The URL-safe form swaps them for <code>-</code> and <code>_</code> and drops the{" "}
        <code>=</code> padding. JSON Web Tokens use it. The decoder here accepts both forms.
      </p>
    </>
  );
}
