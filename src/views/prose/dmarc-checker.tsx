export default function DmarcProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        DMARC is a DNS record at <code>_dmarc.&lt;domain&gt;</code> that tells receivers what to do
        with mail that fails SPF or DKIM, and where to send reports about it. This tool reads that
        record and lists its tags in plain English.
      </p>
      <h2>What to look for</h2>
      <p>
        The <code>p</code> tag is the policy: <code>none</code> only watches,{" "}
        <code>quarantine</code> sends failing mail to spam, and <code>reject</code> blocks it
        outright. A new domain usually starts at <code>none</code> to collect reports, then moves up
        once the reports show real mail is passing.
      </p>
      <p>
        <code>rua</code> is where the daily summary reports go. Without it, nobody is watching who
        sends mail as this domain.
      </p>
      <h2>A missing record is not neutral</h2>
      <p>
        With no DMARC record, receivers fall back to their own judgment about spoofed mail from this
        domain, which is usually more permissive than any policy the owner would choose.
      </p>
    </>
  );
}
