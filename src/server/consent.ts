/**
 * Countries where analytics stays off until the visitor agrees: the EEA, the UK and Switzerland.
 * The same list is given to Google Consent Mode in src/client/analytics.ts; this copy decides
 * who is shown the consent bar. Cloudflare sets cf-ipcountry on every request.
 */
export const CONSENT_REGIONS = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
  "GB",
  "CH",
];

/** Unknown country means ask: a missing header must never switch tracking on silently. */
export function mustAskConsent(headers: Headers): boolean {
  const country = headers.get("cf-ipcountry")?.toUpperCase();
  return !country || country === "XX" || CONSENT_REGIONS.includes(country);
}
