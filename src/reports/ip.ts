import type { IpInfo } from "../lib/ipinfo";
import type { Row } from "./report";

export function ipRows(d: IpInfo): Row[] {
  const place = [d.city, d.region, d.country].filter(Boolean).join(", ");
  const rows: Row[] = [{ label: "Address", value: d.ip }];
  if (place)
    rows.push({
      label: "Location",
      value: place,
      note: "Approximate. Based on the address, not on your device.",
    });
  if (d.org) rows.push({ label: "Network", value: d.org });
  if (d.timezone) rows.push({ label: "Timezone", value: d.timezone });
  if (d.loc) rows.push({ label: "Coordinates", value: d.loc });
  return rows;
}
