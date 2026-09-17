export default function SpfProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        SPF is a DNS record that lists the servers allowed to send mail for a domain. This tool
        reads the domain's TXT records, keeps the one that starts with <code>v=spf1</code>, and
        splits it into its parts.
      </p>
      <h2>What to look for</h2>
      <p>
        The record should end in <code>-all</code> or <code>~all</code>. A record that ends in{" "}
        <code>+all</code> allows anyone to send as you. A domain must have exactly one SPF record.
        Two records make SPF fail for every message.
      </p>
      <p>
        Receivers stop after 10 DNS lookups. Each <code>include</code>, <code>a</code>,{" "}
        <code>mx</code>, <code>exists</code> and <code>redirect</code> costs one, and an included
        record's own lookups count too.
      </p>
      <h2>Records that look right but are ignored</h2>
      <p>
        A record with a hidden character in front of <code>v=spf1</code>, often left behind by a
        copy and paste, is thrown away by receivers. This tool lists those records separately,
        because the owner usually believes they are working.
      </p>
    </>
  );
}
