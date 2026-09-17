export default function UrlCodecProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Percent-encodes text so it is safe inside a URL, or decodes it back. Spaces, slashes,
        <code>&amp;</code> and other characters that have a meaning in a URL are turned into{" "}
        <code>%</code> followed by two hex digits.
      </p>
      <h2>One piece at a time</h2>
      <p>
        This encodes a single value, such as a query parameter — the same thing{" "}
        <code>encodeURIComponent</code> does. It is not for encoding a whole URL, which has
        characters like <code>:</code> and <code>/</code> that should stay as they are.
      </p>
      <h2>Decoding can fail</h2>
      <p>
        A lone <code>%</code>, or one not followed by two valid hex digits, is not valid
        percent-encoding. Decoding it gives a clear error instead of silently dropping characters.
      </p>
    </>
  );
}
