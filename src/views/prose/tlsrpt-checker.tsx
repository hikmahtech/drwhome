export default function TlsrptProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        SMTP TLS Reporting (TLSRPT) is a DNS record at <code>_smtp._tls.&lt;domain&gt;</code> that
        asks other mail servers to report back when they fail to deliver mail to this domain over an
        encrypted connection.
      </p>
      <h2>What to look for</h2>
      <p>
        A working record needs a <code>rua=</code> address. Without one, a sending server that hits
        a broken or downgraded TLS connection has nowhere to tell you, and the failure goes
        unnoticed.
      </p>
      <h2>Not the same as MTA-STS</h2>
      <p>
        TLSRPT only reports problems; it does not enforce encryption. Enforcement is a separate
        record, MTA-STS, checked by its own tool.
      </p>
    </>
  );
}
