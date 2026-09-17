export default function IpProse() {
  return (
    <>
      <h2>What this shows</h2>
      <p>
        Your public IP address is the one websites see when you connect. It belongs to your internet
        provider, your mobile network or your VPN, not to your device.
      </p>
      <h2>Why the location can be wrong</h2>
      <p>
        The location comes from a database that maps address ranges to places. It usually gets the
        country right and the city roughly right. On a mobile network or a VPN it shows where the
        provider's equipment is, which can be far from you.
      </p>
      <h2>IPv4 or IPv6</h2>
      <p>
        You see whichever address your browser used to reach this site. Many connections have both;
        this page shows one.
      </p>
    </>
  );
}
