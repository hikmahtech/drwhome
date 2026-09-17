export default function MxProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        MX records list the mail servers that accept email for a domain, each with a priority
        number. This tool reads them and sorts them lowest first.
      </p>
      <h2>What to look for</h2>
      <p>
        The lowest priority number is tried first; higher numbers are backups. A domain with no MX
        records cannot receive email at all, even if its website works fine — the two are served by
        separate DNS records.
      </p>
      <h2>One record, one job</h2>
      <p>
        A single MX pointing straight at the domain's own web server usually means there is no real
        mail setup, or a fallback with no redundancy if that one server goes down.
      </p>
    </>
  );
}
