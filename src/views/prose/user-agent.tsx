export default function UserAgentProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Reads a browser's user agent string and pulls out the browser, operating system, device and
        rendering engine. The box starts filled with your own browser's string — paste in any other
        one to read that instead.
      </p>
      <h2>Why it is unreliable</h2>
      <p>
        A user agent string is whatever the browser chooses to send, and browsers routinely lie to
        it to avoid being blocked by old sniffing code. Treat the result as a hint, not a fact you
        can build access control on.
      </p>
      <h2>Unknown fields</h2>
      <p>
        A field is left blank when the string does not say — a desktop browser's string, for
        example, says nothing about a device vendor or model.
      </p>
    </>
  );
}
