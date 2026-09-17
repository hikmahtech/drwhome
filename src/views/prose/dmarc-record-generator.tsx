export default function DmarcGeneratorProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Builds a DMARC TXT record and tells you where it goes: on <code>_dmarc.</code> in front of
        your domain, never on the domain itself.
      </p>
      <h2>Start with none</h2>
      <p>
        <code>p=none</code> only asks for reports — it does not protect anything. Read the reports
        that come to your <code>rua</code> address for a while, fix what is failing, then move to{" "}
        <code>quarantine</code> and finally <code>reject</code>. Jumping straight to reject can
        block your own legitimate mail.
      </p>
      <h2>rua and alignment</h2>
      <p>
        Without an <code>rua</code> address you get no reports and cannot see what is failing.
        Strict alignment (<code>adkim=s</code>, <code>aspf=s</code>) requires the signing or sending
        domain to match exactly, not just share a parent domain — tighter, but more likely to break
        mail sent through a third party.
      </p>
    </>
  );
}
