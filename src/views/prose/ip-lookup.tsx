export default function IpLookupProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>Looks up the approximate location and network owner of any IPv4 or IPv6 address.</p>
      <h2>How accurate it is</h2>
      <p>
        The location comes from the address block an internet registry assigned, not from the device
        itself. It is usually right about the city or region, and reliable about the network
        operator — it is not a precise, real-time location.
      </p>
      <h2>Limits</h2>
      <p>Lookups are rate limited per visitor, since each one costs an upstream lookup.</p>
    </>
  );
}
