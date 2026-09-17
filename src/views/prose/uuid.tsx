export default function UuidProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>Generates random identifiers, one to ten at a time, as version 4 or version 7 UUIDs.</p>
      <h2>v4 vs v7</h2>
      <p>
        Version 4 is 122 bits of random data — nothing about it says when it was made. Version 7
        starts with a millisecond timestamp, so values made later sort after values made earlier.
        That makes v7 a better fit for a database primary key or an ordered log.
      </p>
      <h2>Collisions</h2>
      <p>
        Both versions carry enough randomness that a repeat is not a realistic risk, even generating
        billions of them.
      </p>
    </>
  );
}
