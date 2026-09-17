export default function JsonProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>Pastes JSON and formats it with 2 or 4 spaces, or minifies it to one line.</p>
      <h2>Validating</h2>
      <p>
        If the JSON does not parse, this shows the error the parser itself gives — usually the
        position of the character it did not expect. That is often enough to find a missing comma or
        an unquoted key.
      </p>
      <h2>Minify</h2>
      <p>
        Minifying removes every space and line break outside of strings. It does not change what the
        JSON means, only how many bytes it takes to send.
      </p>
    </>
  );
}
