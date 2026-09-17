export default function TlsCertificateProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool connects to the domain on port 443 and reads the TLS certificate the server
        presents: who it was issued to, who issued it, when it expires, every name it covers, and
        whether the chain validates against public certificate authorities.
      </p>
      <h2>What to look for</h2>
      <p>
        "Chain: not validated" means a browser would show a warning — a self-signed certificate, a
        certificate for the wrong name, or a broken chain of intermediate certificates are the
        common causes. Days remaining under 30 is worth renewing soon; a certificate that has
        already expired is validated by no one.
      </p>
      <h2>The fingerprint</h2>
      <p>
        The SHA-256 fingerprint identifies this exact certificate. It's useful for confirming two
        systems are serving the same certificate, or that a renewal actually rotated it.
      </p>
    </>
  );
}
