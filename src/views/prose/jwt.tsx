export default function JwtProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        A JSON Web Token (JWT) is three base64url parts joined by dots: a header, a payload of
        claims, and a signature. This reads the header and payload and shows them as formatted JSON.
        Nothing you paste here is sent anywhere — it is decoded in your browser.
      </p>
      <h2>The signature is not checked</h2>
      <p>
        Decoding a JWT never proves it is genuine. Checking the signature needs the secret or public
        key that signed it, which this page does not have and never asks for. Treat a token you
        cannot verify as untrusted, even if the payload looks right.
      </p>
      <h2>exp, iat and nbf</h2>
      <p>
        <code>iat</code> is when the token was issued, <code>nbf</code> is the earliest it is valid,
        and <code>exp</code> is when it stops being valid — all as seconds since 1970. This page
        turns them into UTC dates and tells you plainly if the token has expired.
      </p>
    </>
  );
}
