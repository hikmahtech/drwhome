export type HowToStep = { step: string; detail: string };

export type WorkedExample = { input: string; output: string; note?: string };

export type Gotcha = { title: string; body: string };

export type FaqEntry = { q: string; a: string };

export type Reference = { title: string; url: string };

export type ToolContent = {
  lead: string;
  overview: string;
  howTo: HowToStep[];
  examples: WorkedExample[];
  gotchas: Gotcha[];
  faq: FaqEntry[];
  related: string[];
  references: Reference[];
};

export const toolContent: Record<string, ToolContent> = {
  base64: {
    lead: "encode and decode base64 in your browser. unicode-safe (utf-8). no network call, no ads, no tracking.",
    overview:
      "base64 encodes binary data as ascii text using 64 printable characters (A-Z, a-z, 0-9, +, /) plus `=` padding. it was originally designed for mime email bodies (rfc 2045) and is now used everywhere: data urls, http basic auth headers, jwt payloads, tls certificates, json transport of binary blobs. this tool encodes utf-8 text to base64 and decodes base64 back to utf-8 text. the work runs client-side in javascript — your input never leaves your browser. base64 expands data by ~33% (every 3 input bytes become 4 output bytes), so it is not compression; it is a reversible ascii-safe wrapper. base64 is not encryption — anyone who can read base64 can decode it.",
    howTo: [
      {
        step: "pick a direction",
        detail: "choose encode (text → base64) or decode (base64 → text).",
      },
      {
        step: "paste or type your input",
        detail: "for encode, paste any utf-8 text. for decode, paste a base64 string.",
      },
      {
        step: "read the output",
        detail:
          "the encoded or decoded result updates as you type. copy it to clipboard with the copy button.",
      },
      {
        step: "handle url-safe variants",
        detail:
          "if your input uses `-` and `_` instead of `+` and `/`, it is base64url. the decoder accepts both.",
      },
    ],
    examples: [
      { input: "hello, world", output: "aGVsbG8sIHdvcmxk", note: "encode utf-8 text" },
      { input: "aGVsbG8sIHdvcmxk", output: "hello, world", note: "decode back" },
      {
        input: "👋 hi",
        output: "8J+RiyBoaQ==",
        note: "emoji preserved via utf-8 byte sequence",
      },
    ],
    gotchas: [
      {
        title: "padding",
        body: "a base64 string without `=` padding may be base64url (stripped padding per rfc 4648) or malformed. this tool pads as needed.",
      },
      {
        title: "line breaks",
        body: "some tools (like openssl) wrap base64 at 64 or 76 chars. strip line breaks before decoding if your decoder rejects them.",
      },
      {
        title: "utf-8 vs bytes",
        body: "this tool assumes utf-8 input for text encoding. for raw binary (images, pdfs), use a file-based tool — typing binary bytes into a text field does not work.",
      },
      {
        title: "url-unsafe chars",
        body: "standard base64 uses `+`, `/`, and `=`, which must be percent-encoded in urls. use base64url instead when building urls or jwts.",
      },
      {
        title: "size overhead",
        body: "base64 expands payload by ~4/3. don't use it as compression, and keep it out of hot paths where bytes matter.",
      },
    ],
    faq: [
      {
        q: "is base64 encryption?",
        a: "no. anyone can decode base64 — it has no key. it is just a binary-to-text encoding. to encrypt, use aes, age, or tls.",
      },
      {
        q: "why does my emoji come out wrong?",
        a: "check that your input is utf-8. some old tools encode characters as ascii-only and lose non-ascii bytes.",
      },
      {
        q: "what is the `=` at the end?",
        a: "padding. base64 encodes in 3-byte groups; when your input length is not a multiple of 3, `=` pads the final group out to 4 characters.",
      },
      {
        q: "what is base64url?",
        a: "a url-safe variant defined in rfc 4648: `+` becomes `-`, `/` becomes `_`, and padding is often stripped. used in jwt and http/2 headers.",
      },
      {
        q: "what is the encoding alphabet?",
        a: "A-Z (0-25), a-z (26-51), 0-9 (52-61), + (62), / (63), = (padding).",
      },
      {
        q: "can i use this for binary files?",
        a: "not directly — paste only text. for files, use `base64 < file` on a unix shell or a file upload tool.",
      },
      {
        q: "does it handle huge strings?",
        a: "up to a few megabytes is fine. for bigger inputs, use a native tool (`base64` command) which does not have to round-trip through a textarea.",
      },
    ],
    related: ["url-codec", "jwt"],
    references: [
      {
        title: "RFC 4648 — base16, base32, base64 encodings",
        url: "https://www.rfc-editor.org/rfc/rfc4648",
      },
      {
        title: "RFC 2045 — mime part one (original base64)",
        url: "https://www.rfc-editor.org/rfc/rfc2045",
      },
      {
        title: "MDN — btoa / atob",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa",
      },
    ],
  },

  json: {
    lead: "format and validate json in your browser. pretty-print with 2 or 4 spaces or minify to a single line. syntax errors are shown inline.",
    overview:
      "json (javascript object notation) is the default data interchange format on the web. it is a text-based format for structured data: objects, arrays, strings, numbers, booleans, and null. the spec (rfc 8259) is small enough to fit on a postcard, but valid json has subtle rules: double-quoted keys, no trailing commas, no comments, no single quotes, no unquoted keys. this tool parses json with the browser's built-in json parser, so what passes here is what your javascript will parse. errors include the position of the first mistake. formatting options: 2-space indent (common in code), 4-space indent (legible for data dumps), minified (single line for apis). valid inputs are pretty-printed; invalid inputs show the parser error so you can fix them.",
    howTo: [
      { step: "paste your json", detail: "paste anywhere. the tool parses as you type." },
      {
        step: "choose indentation",
        detail:
          "pick 2 spaces, 4 spaces, or minified. this affects the output only, not validation.",
      },
      {
        step: "read the error if any",
        detail:
          "if the input is invalid, the error shows the problem and often the character offset.",
      },
      {
        step: "copy the output",
        detail: "copy the formatted text for use in a file, test fixture, or api request body.",
      },
    ],
    examples: [
      {
        input: '{"a":1,"b":[1,2,3]}',
        output: '{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    3\n  ]\n}',
        note: "pretty-printed with 2-space indent",
      },
      {
        input: "{a:1}",
        output: "error: unexpected token a — keys must be double-quoted strings",
        note: "invalid",
      },
      {
        input: '{"a":1,}',
        output: "error: unexpected token } — trailing commas are invalid in json",
        note: "trailing comma",
      },
    ],
    gotchas: [
      {
        title: "trailing commas",
        body: "valid in javascript, invalid in json. remove any comma before `]` or `}`.",
      },
      {
        title: "single quotes",
        body: "json requires double quotes around strings and keys. `'a'` is invalid.",
      },
      {
        title: "comments",
        body: "json has no comments. `//` and `/* */` will fail to parse. if you need comments, use jsonc (a json superset) — but only tools that explicitly support it will parse it.",
      },
      {
        title: "number edge cases",
        body: "json numbers cannot be NaN, Infinity, or have leading zeros. `-.5` is invalid; use `-0.5`. very large integers lose precision beyond 2^53.",
      },
      {
        title: "duplicate keys",
        body: "json technically allows duplicate keys; behaviour depends on the parser. some take the first, some the last. avoid them.",
      },
    ],
    faq: [
      {
        q: "does this send my json anywhere?",
        a: "no. parsing runs in your browser via `JSON.parse` and `JSON.stringify`.",
      },
      {
        q: "what is the size limit?",
        a: "limited by your browser's string memory and the textarea. roughly a few megabytes is fine; gigabytes are not.",
      },
      {
        q: "why does my json say 'unexpected token'?",
        a: "usually a quote, comma, or bracket mismatch. the parser will point at the first problem, but the real mistake is often just before.",
      },
      {
        q: "can i preserve key order?",
        a: "yes. JSON.parse and JSON.stringify preserve insertion order per the spec.",
      },
      {
        q: "does minified json save much?",
        a: "minified removes whitespace. for typical api payloads, expect 5-30% size reduction.",
      },
      {
        q: "what about jsonc or json5?",
        a: "this tool parses strict json (rfc 8259). for jsonc (with comments) or json5 (relaxed syntax), remove those features first or use a dedicated parser.",
      },
      {
        q: "why do my numbers round?",
        a: "javascript numbers are ieee 754 doubles; integers above 2^53 − 1 lose precision. if you need exact big integers in json, encode them as strings.",
      },
    ],
    related: ["base64", "url-codec"],
    references: [
      {
        title: "RFC 8259 — json data interchange format",
        url: "https://www.rfc-editor.org/rfc/rfc8259",
      },
      {
        title: "MDN — JSON.parse",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse",
      },
      {
        title: "MDN — JSON.stringify",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify",
      },
    ],
  },

  "url-codec": {
    lead: "percent-encode and decode url components in your browser. uses encodeURIComponent / decodeURIComponent under the hood. safe for query strings, path segments, and form data.",
    overview:
      "urls carry only a specific subset of ascii characters (letters, digits, and a handful of punctuation). everything else — spaces, non-ascii, reserved characters like `&` and `=` — must be percent-encoded: each offending byte becomes `%` followed by two hex digits. this tool performs percent-encoding with encodeURIComponent (which encodes everything that isn't safe inside a url component) and decoding with decodeURIComponent. use encode when building a query string, path segment, or form body. use decode when reading a url you received from somewhere else. the encoding is utf-8 aware — non-ascii characters are first converted to utf-8 bytes, then each byte is percent-encoded. this is the same behaviour as every modern browser.",
    howTo: [
      {
        step: "pick a direction",
        detail: "encode turns text into url-safe form. decode turns percent-encoded text back.",
      },
      {
        step: "paste input",
        detail: "for encode, paste any text. for decode, paste a percent-encoded string.",
      },
      {
        step: "read output",
        detail: "the result updates as you type. copy it for use in a url or form.",
      },
      {
        step: "pick the right variant",
        detail:
          "encodeURIComponent encodes everything unsafe in a component. encodeURI (less common) leaves url delimiters like `/` alone and is meant for whole urls. this tool uses encodeURIComponent.",
      },
    ],
    examples: [
      { input: "hello world", output: "hello%20world", note: "space becomes %20" },
      { input: "a=b&c=d", output: "a%3Db%26c%3Dd", note: "reserved chars in a value" },
      { input: "café", output: "caf%C3%A9", note: "utf-8: é = C3 A9" },
    ],
    gotchas: [
      {
        title: "encode vs encodeURI",
        body: "encodeURI does not encode :/?#[]@!$&'()*+,;=. it is for whole urls. use encodeURIComponent (what this tool uses) for anything going inside a component like a query value.",
      },
      {
        title: "plus vs space",
        body: "html forms encode spaces as `+`, not `%20`. browsers accept both in query strings. if you are debugging form encoding, unescape both.",
      },
      {
        title: "double encoding",
        body: "encoding an already-encoded string produces gibberish (`%25` everywhere). check the input is raw text before encoding.",
      },
      {
        title: "length change",
        body: "ascii stays 1 char → 3 chars. utf-8 multi-byte becomes `%xx` per byte (2-4× growth). do not put large data in query strings.",
      },
      {
        title: "max url length",
        body: "browsers and servers cap urls around 2k-8k chars. use a post body for anything larger.",
      },
    ],
    faq: [
      {
        q: "does this send my input anywhere?",
        a: "no. encoding and decoding run in your browser.",
      },
      {
        q: "what is the difference between encodeURI and encodeURIComponent?",
        a: "encodeURI leaves url delimiters alone — good for encoding a whole url. encodeURIComponent encodes those delimiters — good for encoding a piece of a url (a query value, a path segment). this tool uses the latter because it is the safer default for user data.",
      },
      {
        q: "why does `+` not become `%2B`?",
        a: "in a query string, `+` represents a space in application/x-www-form-urlencoded. encodeURIComponent keeps it literal. if you need a literal `+`, encode it manually as `%2B`.",
      },
      {
        q: "what about unicode?",
        a: "characters outside the basic ascii range are encoded as their utf-8 byte sequence, each byte as `%xx`. é (U+00E9) becomes `%C3%A9`.",
      },
      {
        q: "can i decode query strings?",
        a: "yes, but this tool decodes a single string. for a full query string, use URLSearchParams or split on `&` and decode each piece.",
      },
      {
        q: "why is my decoded output truncated at `%`?",
        a: "a trailing `%` without two hex digits is invalid and throws an error. fix the input.",
      },
      {
        q: "does case matter in hex?",
        a: "no. %20 and %20 decode the same. encoders emit uppercase per rfc 3986.",
      },
    ],
    related: ["base64", "json"],
    references: [
      {
        title: "RFC 3986 — uniform resource identifier (uri) syntax",
        url: "https://www.rfc-editor.org/rfc/rfc3986",
      },
      {
        title: "MDN — encodeURIComponent",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent",
      },
      { title: "WHATWG — URL standard", url: "https://url.spec.whatwg.org/" },
    ],
  },

  uuid: {
    lead: "generate uuids in your browser: v4 (random) or v7 (time-ordered). v7 is the modern choice for database primary keys; v4 is fine for everything else.",
    overview:
      "a uuid (universally unique identifier) is a 128-bit value typically rendered as 36 hex characters with dashes. two common versions: v4, which is 122 random bits (2 bits and a nibble are fixed for version and variant) — effectively never collides in practice; and v7, which puts a 48-bit unix millisecond timestamp at the front of the id, then 74 bits of randomness. v7 (rfc 9562, published 2024) is designed for database primary keys — id order roughly matches insertion time, which keeps b-tree indexes compact and avoids random-insertion penalties. v4 stays useful for tokens, cache keys, correlation ids, and anywhere ordering does not matter. both versions produce 36-char strings of the form xxxxxxxx-xxxx-Vxxx-yxxx-xxxxxxxxxxxx, where V is the version digit (4 or 7).",
    howTo: [
      {
        step: "pick a version",
        detail:
          "v4 for generic random ids. v7 for anything stored in a database and used as a primary key or index.",
      },
      {
        step: "click generate",
        detail: "one click produces one uuid. generate multiple by clicking again.",
      },
      {
        step: "copy and use",
        detail: "copy the result and paste into your code, database, or config.",
      },
    ],
    examples: [
      {
        input: "(click v4)",
        output: "b3f9d4f8-0a23-4a6b-a4d2-5c8a6b3f9e2a",
        note: "v4 — fully random",
      },
      {
        input: "(click v7)",
        output: "018ef3e5-7b12-7a9c-b4d2-5c8a6b3f9e2a",
        note: "v7 — first 12 hex chars encode the unix millis; ids generated close in time share a prefix",
      },
      {
        input: "(click v4 twice)",
        output: "two different uuids",
        note: "collision probability is astronomically low (~2^61 generations for a 50% chance)",
      },
    ],
    gotchas: [
      {
        title: "v1 / v2 deprecated",
        body: "v1 included the mac address and was deprecated for privacy. v2 is almost never used. v3 and v5 are deterministic (namespace + name hash). prefer v4 or v7 for new work.",
      },
      {
        title: "v4 in indexes",
        body: "random v4 ids as primary keys cause heavy b-tree page splits, slow inserts, and fragmented indexes at scale. switch to v7 for new tables.",
      },
      {
        title: "v7 privacy",
        body: "v7 leaks the creation timestamp (millisecond precision). if timing reveals information (account creation, event sequence), use v4 or hash-based identifiers instead.",
      },
      {
        title: "case & hyphens",
        body: "uuids are case-insensitive hex. most tools emit lowercase. some systems store without hyphens as 32 chars — equivalent.",
      },
      {
        title: "not secrets",
        body: "uuids are not random enough to be auth tokens on their own. use a csprng-derived token for auth.",
      },
    ],
    faq: [
      {
        q: "v4 or v7?",
        a: "v7 if the id is stored and indexed. v4 if it's ephemeral or used as a nonce. v7 gives you ordering plus uniqueness; v4 gives you uniqueness only.",
      },
      {
        q: "what is the collision probability for v4?",
        a: "with 122 random bits, you would need to generate ~2.7 billion uuids to hit a 50% chance of a single collision (the birthday bound). not a practical concern.",
      },
      {
        q: "are v7 uuids sortable?",
        a: "yes, lexicographically. two v7 ids compare the same way as their timestamps (and then random bits for ties within the same millisecond).",
      },
      {
        q: "does this generate uuids locally?",
        a: "yes. crypto.randomUUID (v4) and an in-browser v7 implementation run in your browser.",
      },
      {
        q: "what is the 4 or 7 in the uuid?",
        a: "the version digit. position 14 (0-indexed) is always the version: 4 for v4, 7 for v7.",
      },
      {
        q: "why does my v7 look almost the same as the last one?",
        a: "because v7 is time-ordered. two uuids generated in the same millisecond share their first 12 hex chars.",
      },
      {
        q: "what about ulid or ksuid?",
        a: "ulid and ksuid are similar time-ordered designs. v7 is now the standard ietf version — prefer it for new work.",
      },
    ],
    related: ["base64", "jwt"],
    references: [
      {
        title: "RFC 9562 — uuid formats (replaces rfc 4122)",
        url: "https://www.rfc-editor.org/rfc/rfc9562",
      },
      {
        title: "MDN — Crypto.randomUUID",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID",
      },
      {
        title: "Buildkite — goodbye integers, hello uuidv7",
        url: "https://buildkite.com/blog/goodbye-integers-hello-uuids",
      },
    ],
  },

  jwt: {
    lead: "decode json web tokens (jwt) in your browser. split header, payload, and signature; base64url-decode and pretty-print the header and claims. no signature verification — this is a debug tool, not a security check.",
    overview:
      "a jwt is a compact, url-safe string of three base64url-encoded segments joined with dots: header.payload.signature. the header declares the signing algorithm, the payload carries claims (iss, sub, aud, exp, iat, …), and the signature authenticates the header and payload against a secret or key. this decoder splits the three segments and base64url-decodes the header and payload so you can read them. it does not verify the signature — that requires the issuer's public key or shared secret and is a separate concern. use this to inspect what a token contains during development, debug expiry issues, or confirm the iss/aud your backend expects. for production checks, use a jwt library in your own code.",
    howTo: [
      {
        step: "paste the token",
        detail:
          "paste your jwt (e.g. eyJhbGc…) into the input field. it should be three base64url segments separated by dots.",
      },
      {
        step: "read the header",
        detail:
          "the header shows the signing algorithm (alg) and token type (typ). hs256, rs256, es256, or `none` are the common algs.",
      },
      {
        step: "read the claims",
        detail:
          "the payload shows registered claims like iss, sub, aud, exp, iat, nbf, and custom claims your issuer adds. exp and iat are unix seconds.",
      },
      {
        step: "check expiry",
        detail:
          "convert the exp unix timestamp to a local time to see whether the token is still valid. an expired token has exp in the past.",
      },
    ],
    examples: [
      {
        input:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        output:
          '{\n  "header": {"alg": "HS256", "typ": "JWT"},\n  "payload": {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}\n}',
        note: "the classic HS256 example from jwt.io",
      },
      {
        input: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1MTYyMzkwMjJ9.abc",
        output: '{"header": {"alg": "HS256"}, "payload": {"exp": 1516239022}}',
        note: "exp 1516239022 is 2018-01-18 — expired",
      },
      {
        input: "not.a.jwt",
        output: "error: segments are not base64url",
        note: "invalid input",
      },
    ],
    gotchas: [
      {
        title: "base64url ≠ base64",
        body: "jwt segments use base64url (url-safe alphabet, no padding). a standard base64 decoder may fail. this tool handles both.",
      },
      {
        title: "signature not verified",
        body: "decoding is not verifying. an attacker can change claims and re-encode — the signature only detects that if you check it with the right key. use a library server-side for verification.",
      },
      {
        title: "`alg: none`",
        body: "some legacy libraries accepted `alg: none` tokens as valid. any real verifier must reject none or enforce an allow-list of expected algorithms.",
      },
      {
        title: "clock skew",
        body: "exp and iat are unix seconds. allow a small leeway (usually 30-60s) for clock skew between issuer and verifier.",
      },
      {
        title: "token exposure",
        body: "if you paste a token here, you are exposing its contents to your browser (and this site's javascript). we do not store or transmit tokens, but do not paste live production tokens into any online tool.",
      },
    ],
    faq: [
      {
        q: "does this verify the signature?",
        a: "no. signature verification needs the issuer's public key or secret, which we do not have and will not ask for. use a jwt library in your backend for verification.",
      },
      {
        q: "where does decoding happen?",
        a: "client-side. the token is base64url-decoded in your browser. it is not sent to our servers or any third party.",
      },
      {
        q: "what algorithms are supported?",
        a: "decoding is algorithm-agnostic — the segments are just base64url. the alg claim tells you what was used to sign.",
      },
      {
        q: "is my token safe to paste?",
        a: "avoid pasting live production tokens into any online tool. even though this one decodes locally, paste test tokens or regenerate afterward. if in doubt, use `echo $TOKEN | cut -d. -f2 | base64 -d | jq` locally.",
      },
      {
        q: "what about jwe?",
        a: "jwe (encrypted jwt) has five segments, not three. this tool decodes jws (the signed form). jwe payloads cannot be read without the decryption key.",
      },
      {
        q: "can i check expiry?",
        a: "the decoded payload shows exp as a unix timestamp. a value in the past means the token is expired. a value in the future means it is still valid (unless revoked).",
      },
      {
        q: "can ai agents call this?",
        a: "yes. the mcp endpoint at drwho.me/mcp/mcp exposes `jwt_decode` for claude desktop, cursor, windsurf, and any mcp-capable client.",
      },
    ],
    related: ["base64", "json"],
    references: [
      { title: "RFC 7519 — json web token (jwt)", url: "https://www.rfc-editor.org/rfc/rfc7519" },
      {
        title: "RFC 7515 — json web signature (jws)",
        url: "https://www.rfc-editor.org/rfc/rfc7515",
      },
      { title: "jwt.io — debugger and algorithm reference", url: "https://jwt.io" },
      {
        title: "MDN — json web tokens (jwt)",
        url: "https://developer.mozilla.org/en-US/docs/Glossary/JWT",
      },
    ],
  },

  "user-agent": {
    lead: "parse your browser's user-agent string into browser, os, device, and rendering engine. reads navigator.userAgent and shows what a server would see.",
    overview:
      "the user-agent string is an http header that browsers send on every request to identify themselves. it is a fossil: started as `mozilla/5.0` to pretend to be netscape, then grew rendering engine markers, then os markers, then device markers, and now contains vendor strings for chrome, safari, edge, firefox, and their forks. parsing it is brittle — vendor changes shift the output format, and the same browser can look different on different devices. this tool reads the string directly from navigator.userAgent and parses out: browser name and version, rendering engine (blink/webkit/gecko), os and version, and device hints (mobile/tablet/desktop). useful for debugging device-specific bugs, confirming what identity your browser exposes, and testing ua sniffing. google has been telling developers for years to use feature detection instead of ua sniffing, but ua remains useful for analytics and diagnostics.",
    howTo: [
      { step: "load the page", detail: "the tool reads your ua on load — nothing to input." },
      {
        step: "inspect the parsed fields",
        detail: "browser, os, device, engine are broken out.",
      },
      {
        step: "copy the raw string",
        detail: "the full navigator.userAgent is shown with a copy button for use in bug reports.",
      },
      {
        step: "compare across devices",
        detail: "open the page on a different browser or device to see the difference.",
      },
    ],
    examples: [
      {
        input:
          "mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 (khtml, like gecko) chrome/131.0.0.0 safari/537.36",
        output: "chrome 131, blink, macos 10.15.7, desktop",
        note: "standard desktop chrome",
      },
      {
        input:
          "mozilla/5.0 (iphone; cpu iphone os 17_4 like mac os x) applewebkit/605.1.15 version/17.4 mobile/15e148 safari/604.1",
        output: "safari 17.4, webkit, ios 17.4, mobile",
        note: "safari on iphone",
      },
      {
        input: "mozilla/5.0 (compatible; googlebot/2.1; +http://www.google.com/bot.html)",
        output: "googlebot 2.1, crawler",
        note: "bot, not a browser",
      },
    ],
    gotchas: [
      {
        title: "user-agent reduction",
        body: "modern browsers emit a reduced ua string and expose detail via sec-ch-ua client hints instead. what you see is intentionally coarse.",
      },
      {
        title: "spoofing",
        body: "the ua can be changed in devtools or by extensions. treat it as a hint, not a guarantee.",
      },
      {
        title: "ua-only bot detection is unreliable",
        body: "attackers set whatever ua they want. combine with behaviour signals for real bot detection.",
      },
      {
        title: "legacy cruft",
        body: "`mozilla/5.0` is meaningless; every modern browser claims it. the useful parts are after the first paren.",
      },
      {
        title: "brand fragmentation",
        body: "chromium-based browsers (edge, brave, opera, arc) all include `chrome` plus their own marker. parse for the vendor-specific marker last.",
      },
    ],
    faq: [
      {
        q: "does this send my ua anywhere?",
        a: "no. parsing runs in your browser.",
      },
      {
        q: "why does chrome say `safari` at the end?",
        a: "historical compatibility. chrome's ua claims safari so old ua-sniffing code that only looked for 'webkit' or 'safari' still works.",
      },
      {
        q: "what are user-agent client hints?",
        a: "a newer mechanism (sec-ch-ua headers) that exposes browser, platform, and architecture separately and negotiates which fields to send.",
      },
      {
        q: "can i change my ua?",
        a: "yes — in devtools → network conditions → user agent. also via extensions. servers have no way to tell if you have changed it.",
      },
      {
        q: "is ua reliable for feature detection?",
        a: "no. use `in` checks, CSS @supports, or function/feature probes. ua sniffing is fragile.",
      },
      {
        q: "why does my parser disagree with another?",
        a: "ua parsing is heuristic. two parsers with different rule sets can disagree on the same input. we use ua-parser-js under the hood.",
      },
      {
        q: "can ai agents call this over mcp?",
        a: "yes — user_agent_parse on the mcp endpoint at drwho.me/mcp/mcp.",
      },
    ],
    related: ["headers", "ip"],
    references: [
      {
        title: "RFC 9110 — http semantics (user-agent header)",
        url: "https://www.rfc-editor.org/rfc/rfc9110",
      },
      {
        title: "MDN — navigator.userAgent",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent",
      },
      { title: "WICG — user-agent client hints", url: "https://wicg.github.io/ua-client-hints/" },
    ],
  },

  ip: {
    lead: "show your public ip address, approximate location, and timezone. reads the ip your request hit drwho.me with — not your lan ip.",
    overview:
      "your 'public ip' is the address the internet sees when your traffic leaves your network. it is usually your router's wan ip, or — if you are behind a vpn — the vpn's exit ip. this tool reads the ip from the incoming http request (vercel's edge forwards the client ip as a trusted header) and shows it back to you along with rough geolocation (country, region, city) and timezone. accuracy varies: wired residential connections geolocate well, mobile carriers and vpns often place you far from your real location. the ip shown is your public ip, not your lan ip (192.168.x.x or 10.x.x.x) — no website can see those. if you need your lan ip, check your os network settings.",
    howTo: [
      { step: "load the page", detail: "everything is shown on load. no input needed." },
      {
        step: "read your public ip",
        detail:
          "the ip shown is the one the internet sees. if you are behind a vpn, this is the vpn's exit ip.",
      },
      {
        step: "check the location",
        detail:
          "city/region/country come from a geoip database — approximate, not gps. expect city-level accuracy at best.",
      },
      {
        step: "check the timezone",
        detail: "iana timezone id (e.g. europe/london) derived from the ip.",
      },
    ],
    examples: [
      {
        input: "(no input)",
        output: "ipv4 203.0.113.42, country india, city bengaluru, timezone asia/kolkata",
        note: "example for a residential isp in bengaluru",
      },
      {
        input: "(over vpn)",
        output: "ip and location match the vpn exit, not your physical location",
        note: "vpn hides your real ip",
      },
      {
        input: "(ipv6 connection)",
        output: "starts with 2001:… or 2600:…; geoip data may be sparser than ipv4",
        note: "ipv6",
      },
    ],
    gotchas: [
      {
        title: "vpn masks you",
        body: "if you are on a vpn, the ip and location are the vpn provider's. disconnect the vpn to see your real ip.",
      },
      {
        title: "accuracy is approximate",
        body: "geoip data is not gps. it resolves to the network's registered location, often an isp point-of-presence in the nearest major city.",
      },
      {
        title: "cgnat",
        body: "mobile users often share an ip with thousands of others via carrier-grade nat. the geolocation is the carrier's hub, not your phone.",
      },
      {
        title: "ipv4 vs ipv6",
        body: "if your connection supports both, the site may see the ipv6 address. both are public ips.",
      },
      {
        title: "not your lan ip",
        body: "192.168.x.x and 10.x.x.x are private (rfc 1918). no website can see them.",
      },
    ],
    faq: [
      {
        q: "does this store my ip?",
        a: "no. we read it from the request headers and return it to you. no logs.",
      },
      {
        q: "why is my location wrong?",
        a: "geoip is approximate. mobile ips, vpns, and corporate networks often geolocate far from your real location.",
      },
      {
        q: "how is my ip detected?",
        a: "vercel's edge forwards the client ip in a trusted header. we do not run any javascript probes.",
      },
      {
        q: "can i hide my ip?",
        a: "use a vpn or tor. this site will then see the vpn/tor exit ip, not your real one.",
      },
      {
        q: "what is the difference between this and ip lookup?",
        a: "this shows your own ip. ip lookup takes any ip and returns geolocation and asn details.",
      },
      {
        q: "what about my lan ip?",
        a: "no website can see your lan ip. check your os network settings (ipconfig on windows, `ifconfig` or `ip addr` on linux/macos).",
      },
      {
        q: "ipv4 or ipv6?",
        a: "whichever your connection used to reach us. many isps are ipv6-first now.",
      },
    ],
    related: ["ip-lookup", "headers"],
    references: [
      { title: "RFC 791 — internet protocol (ipv4)", url: "https://www.rfc-editor.org/rfc/rfc791" },
      {
        title: "RFC 8200 — internet protocol version 6 (ipv6)",
        url: "https://www.rfc-editor.org/rfc/rfc8200",
      },
      {
        title: "MDN — Geolocation API (browser, distinct from ip geoip)",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API",
      },
    ],
  },

  headers: {
    lead: "inspect the http request headers your browser sends to drwho.me: user-agent, accept, accept-language, cookie (if any), and more. read-only — no credentials collected.",
    overview:
      "every http request carries a set of headers: key-value metadata that tells the server what the client wants and can accept. browsers set most of them automatically — user-agent, accept, accept-language, accept-encoding, connection, and so on. servers, reverse proxies, and cdns add their own en route (cf-ray, x-vercel-id, etc.). this tool shows the headers that arrived at drwho.me with your request. it is read-only: we read what vercel's edge observed and render it back. useful for: debugging cors failures, verifying an api gateway's routing, inspecting what locale your browser advertises, seeing what a bot sends, or checking your cdn's request fingerprint. sensitive values (cookie, authorization) are shown only if your browser sent them — and they are not stored.",
    howTo: [
      { step: "load the page", detail: "everything renders on load. no input needed." },
      { step: "scan the list", detail: "headers are listed alphabetically by name." },
      {
        step: "look for custom headers",
        detail:
          "your proxy, firewall, or extension may inject custom headers (starting with x-). they will appear if forwarded.",
      },
      {
        step: "reload to refresh",
        detail:
          "if you change something (disable an extension, switch browser), reload to see updated headers.",
      },
    ],
    examples: [
      {
        input: "(chrome on macos)",
        output:
          'user-agent: mozilla/5.0 …\naccept: text/html,…\naccept-language: en-us,en;q=0.9\nsec-ch-ua: "chromium";v="131", …',
        note: "typical desktop browser",
      },
      {
        input: "(curl)",
        output: "user-agent: curl/8.4.0\naccept: */*\nhost: drwho.me",
        note: "minimal — curl sends very few headers",
      },
      {
        input: "(behind a corporate proxy)",
        output: "adds x-forwarded-for, via, x-corp-trace-id, etc.",
        note: "headers accumulate through proxies",
      },
    ],
    gotchas: [
      {
        title: "cookies",
        body: "the cookie header only appears if your browser has cookies for this domain. drwho.me sets none itself, so this will usually be empty.",
      },
      {
        title: "client hints",
        body: "modern browsers send reduced ua plus sec-ch-ua* client hints. the main user-agent value is intentionally coarse.",
      },
      {
        title: "proxy headers",
        body: "x-forwarded-for, x-real-ip, via are added by intermediaries. they may contain your real ip chain.",
      },
      {
        title: "host header",
        body: "the host header identifies which domain you are addressing. it determines routing for multi-tenant setups.",
      },
      {
        title: "order not guaranteed",
        body: "http does not define header ordering. tools may display them sorted; servers may receive them in any order.",
      },
    ],
    faq: [
      {
        q: "does this store my headers?",
        a: "no. we read them from the request and render them back.",
      },
      {
        q: "where does the sec-ch-ua header come from?",
        a: "modern chromium-based browsers emit it as part of user-agent client hints, alongside a reduced user-agent.",
      },
      {
        q: "my authorization header isn't showing — why?",
        a: "browsers do not automatically send authorization headers to cross-origin sites unless you add them explicitly in code. this is a plain navigation, so no auth.",
      },
      {
        q: "what is accept-encoding for?",
        a: "it tells the server which compression methods you support (gzip, br, deflate, zstd). the server uses the best one.",
      },
      {
        q: "why do i see cf-* headers?",
        a: "cloudflare's edge adds those when you pass through cloudflare. similar for x-vercel-id on vercel, x-akamai-* on akamai.",
      },
      {
        q: "can i test with custom headers?",
        a: 'not from this page. use `curl -H "x-custom: value"` or a tool like postman to craft requests.',
      },
      {
        q: "does my isp see these?",
        a: "https encrypts headers between your browser and drwho.me, so your isp sees only the hostname (via sni) and traffic volume.",
      },
    ],
    related: ["user-agent", "ip"],
    references: [
      { title: "RFC 9110 — http semantics", url: "https://www.rfc-editor.org/rfc/rfc9110" },
      {
        title: "MDN — http headers",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers",
      },
      { title: "RFC 7239 — forwarded http header", url: "https://www.rfc-editor.org/rfc/rfc7239" },
    ],
  },

  "ip-lookup": {
    lead: "look up any public ip: country, region, city, asn, isp, and hostname (reverse dns). backed by ipinfo.io — send an ip, get geolocation and network details.",
    overview:
      "an ip lookup takes an ipv4 or ipv6 address and resolves it to network and location metadata: the autonomous system number (asn) that owns the ip, the company or isp that announced it, the country/region/city from the geoip database, and optionally the reverse dns hostname. useful for debugging where a client actually came from, investigating suspicious traffic, figuring out which cloud provider an ip belongs to (aws ranges, google cloud, cloudflare), or confirming a cdn's pop. drwho.me forwards your query to ipinfo.io, which runs on its own infrastructure with the maxmind geoip database and public bgp/whois sources. results are as accurate as the geoip data — city-level at best, country-level reliably. private ip ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x, fd00::/8) return no useful geolocation because they are not routable on the public internet.",
    howTo: [
      {
        step: "enter an ip",
        detail:
          "ipv4 (e.g. 8.8.8.8) or ipv6 (2606:4700:4700::1111). hostnames are not accepted — resolve them with the dns tool first.",
      },
      {
        step: "click lookup",
        detail: "the query is sent to ipinfo.io and the result returned.",
      },
      {
        step: "read the fields",
        detail: "country, region, city, org (asn + isp), hostname (reverse dns).",
      },
      {
        step: "interpret the asn",
        detail:
          "as15169 is google, as32934 is meta, as13335 is cloudflare, as14061 is digitalocean, as16509 is aws.",
      },
    ],
    examples: [
      {
        input: "8.8.8.8",
        output: "country us, city mountain view, org as15169 google llc, hostname dns.google",
        note: "google public dns",
      },
      {
        input: "1.1.1.1",
        output: "country au (anycast), org as13335 cloudflare, hostname one.one.one.one",
        note: "cloudflare public dns — all 1.1.1.1s share the ip via anycast",
      },
      {
        input: "2606:4700:4700::1111",
        output: "same as 1.1.1.1 but ipv6",
        note: "cloudflare ipv6",
      },
    ],
    gotchas: [
      {
        title: "anycast",
        body: "the same ip can be advertised from many locations (google, cloudflare, major cdns). geoip returns one of the registered locations, not where your packet actually went.",
      },
      {
        title: "accuracy",
        body: "city-level geoip is ~50-80% accurate for residential ips, far worse for mobile and corporate. country-level is ~99%.",
      },
      {
        title: "private ranges",
        body: "rfc 1918 (10.*, 172.16-31.*, 192.168.*) and rfc 6598 (100.64.0.0/10 cgnat) are not routable. a lookup will say 'bogon' or return empty.",
      },
      {
        title: "stale data",
        body: "asn and whois updates lag reality. an ip may have changed owner days before public databases update.",
      },
      {
        title: "rate limits",
        body: "ipinfo.io enforces free-tier rate limits. rapid repeated lookups may return 429.",
      },
    ],
    faq: [
      {
        q: "does this store the ip i query?",
        a: "we proxy the query to ipinfo.io and return the response. we do not store the query. ipinfo.io's privacy policy applies to their side.",
      },
      {
        q: "what is asn?",
        a: "autonomous system number — the id of the network that announces an ip range on the public internet. every isp, cloud provider, and large company has one or more asns.",
      },
      {
        q: "how is this different from whois?",
        a: "whois returns contact and administrative data for an ip block. ip lookup adds geoip, reverse dns, and convenience formatting. whois is the authoritative source; geoip is inferred.",
      },
      {
        q: "can i look up a hostname?",
        a: "not directly. resolve the hostname to an ip first using the dns tool, then run that ip through ip lookup.",
      },
      {
        q: "what about my own ip?",
        a: "use the 'what is my ip' tool — it reads your ip automatically without needing input.",
      },
      {
        q: "can ai agents call this?",
        a: "yes — ip_lookup on the mcp endpoint at drwho.me/mcp/mcp.",
      },
      {
        q: "why is the city different from where the server is?",
        a: "geoip resolves where the ip is registered, not where a physical server sits. cloud providers often register ip blocks to their head office while hosting them in a specific data center.",
      },
    ],
    related: ["ip", "dns"],
    references: [
      {
        title: "RFC 1918 — private address space (ipv4)",
        url: "https://www.rfc-editor.org/rfc/rfc1918",
      },
      { title: "ipinfo.io — data source", url: "https://ipinfo.io" },
      {
        title: "MaxMind GeoLite2 — geoip database",
        url: "https://dev.maxmind.com/geoip/geolite2-free-geolocation-data",
      },
    ],
  },

  dns: {
    lead: "resolve dns records — a, aaaa, mx, txt, ns, cname — for any hostname. backed by cloudflare's dns-over-https (doh) resolver at 1.1.1.1. queries run from our server, not yours.",
    overview:
      "dns (domain name system) translates hostnames into ip addresses and other metadata. every time you visit a site, your os asks a resolver (usually your isp's) for the a record (ipv4) or aaaa record (ipv6) of the hostname. this tool asks cloudflare's public resolver at 1.1.1.1 directly over https (dns-over-https, rfc 8484), bypassing your local resolver. it returns: a records (ipv4), aaaa (ipv6), mx (mail servers, with priorities), txt (arbitrary text — spf, dkim, domain verification), ns (nameservers for the zone), and cname (canonical alias). results reflect what cloudflare's resolver currently has cached, which is usually close to authoritative but may lag a few minutes on recent changes. use it to verify dns changes from a third-party viewpoint, debug email delivery (mx + spf + dkim), check domain verification tokens, or confirm a cname points where you expect.",
    howTo: [
      {
        step: "enter a hostname",
        detail: "a domain like drwho.me or a subdomain like api.example.com. no protocol, no path.",
      },
      {
        step: "pick a record type",
        detail:
          "a for ipv4, aaaa for ipv6, mx for email, txt for notes and verification, ns for nameservers, cname for aliases.",
      },
      {
        step: "click resolve",
        detail: "the query is sent to cloudflare's doh endpoint and the answer shown.",
      },
      {
        step: "interpret the ttl",
        detail:
          "each record has a time-to-live (ttl) in seconds. resolvers will cache the record for at most that long.",
      },
    ],
    examples: [
      {
        input: "drwho.me (a)",
        output: "76.76.21.21, ttl 300",
        note: "vercel's anycast edge",
      },
      {
        input: "gmail.com (mx)",
        output:
          "5 gmail-smtp-in.l.google.com.\n10 alt1.gmail-smtp-in.l.google.com.\n20 alt2.gmail-smtp-in.l.google.com.",
        note: "priority-ordered mail servers",
      },
      {
        input: "drwho.me (txt)",
        output: "v=spf1 include:amazonses.com ~all\\ngoogle-site-verification=…",
        note: "spf + site verification tokens",
      },
    ],
    gotchas: [
      {
        title: "caching & ttl",
        body: "dns is aggressively cached. a new record may take up to the old record's ttl to propagate. if you just changed a record, wait or query an authoritative nameserver directly.",
      },
      {
        title: "cname restrictions",
        body: "a hostname with a cname cannot have other records (a, mx, etc.) at the same name. cname at the apex (example.com directly) is technically invalid — use an 'alias' or 'aname' record type from your dns provider, or an a record.",
      },
      {
        title: "trailing dots",
        body: "in raw dns, hostnames end with `.` (the root). most tools accept both forms. ns and mx records always include the trailing dot in the answer.",
      },
      {
        title: "spf length",
        body: "txt records are limited to 255 chars per string; multiple strings in one record are concatenated. long spf records must be split.",
      },
      {
        title: "doh vs udp",
        body: "this tool uses doh over cloudflare. your os uses udp/53 by default. results should match, but if your isp does dns filtering, you may see different answers locally.",
      },
    ],
    faq: [
      {
        q: "whose resolver does this use?",
        a: "cloudflare's public resolver at 1.1.1.1 via dns-over-https (rfc 8484). doh is used so the service can query dns without raw-udp access.",
      },
      {
        q: "why does my result differ from `dig`?",
        a: "caching. `dig @1.1.1.1` would match this tool. `dig` with the system resolver uses whatever your isp or router configured — which may lag or filter.",
      },
      {
        q: "what is the difference between a and aaaa?",
        a: "a is ipv4 (32-bit address). aaaa is ipv6 (128-bit). many domains have both; modern clients prefer aaaa when available.",
      },
      {
        q: "can i query subdomains?",
        a: "yes. api.example.com, mail.example.com, any fully qualified name.",
      },
      {
        q: "does this support dnssec?",
        a: "cloudflare validates dnssec automatically; a failure returns an error. we display the answer as-is but do not show dnssec status fields.",
      },
      {
        q: "why is mx returning nothing?",
        a: "the domain may accept no mail (no mx set). or the domain may use null mx (`0 .`) to declare it never receives mail.",
      },
      {
        q: "can ai agents call this?",
        a: "yes — dns_lookup on the mcp endpoint at drwho.me/mcp/mcp.",
      },
    ],
    related: ["ip-lookup", "ip"],
    references: [
      {
        title: "RFC 1035 — domain names (dns basics)",
        url: "https://www.rfc-editor.org/rfc/rfc1035",
      },
      { title: "RFC 8484 — dns over https (doh)", url: "https://www.rfc-editor.org/rfc/rfc8484" },
      { title: "Cloudflare 1.1.1.1 — public resolver", url: "https://1.1.1.1" },
    ],
  },
  "dossier-dns": {
    lead: "resolve a, aaaa, ns, soa, caa, and txt records for a domain in one shot. part of the drwho.me domain dossier.",
    overview:
      "a single pass that fans out six parallel doh queries against cloudflare's resolver and gathers the answers into one view. the same pure function powers the domain dossier page (`/d/<domain>`), the standalone tool, and the mcp tool — no logic duplication. this is the first satellite of the domain dossier; more sections (tls, email auth, headers, cors, redirects) are landing across subsequent plans.",
    howTo: [
      {
        step: "enter a bare domain",
        detail:
          "public fqdn only. no schemes, no ports, no paths. ips and rfc1918 ranges are rejected.",
      },
      {
        step: "run the check",
        detail:
          "the tool queries a, aaaa, ns, soa, caa, txt in parallel via cloudflare doh. results stream in together.",
      },
      {
        step: "inspect the records",
        detail: "each record type is shown with its ttl and rdata. empty types render a dash.",
      },
    ],
    examples: [
      {
        input: "example.com",
        output:
          "A ttl=300 93.184.216.34 · NS ttl=86400 a.iana-servers.net. · SOA ttl=3600 ns.icann.org. …",
        note: "most public sites return a, ns, soa at minimum.",
      },
      {
        input: "drwho.me",
        output: "A ttl=60 76.76.21.21 · NS ttl=3600 ns1.vercel-dns.com. · TXT ttl=60 v=spf1 -all …",
        note: "a typical vercel-hosted site — short ttls, cloud-managed nameservers.",
      },
    ],
    gotchas: [
      {
        title: "no subdomain enumeration here",
        body: "this tool queries record types for the exact name you enter. for subdomain discovery (via ct logs) see the upcoming subdomains check in a later dossier bundle.",
      },
      {
        title: "resolver caching",
        body: "cloudflare doh caches per ttl. fresh changes to your zone may not appear for up to the record's ttl window.",
      },
      {
        title: "empty txt doesn't mean broken",
        body: "many domains have no txt records at all. an empty txt block is a finding, not an error. email auth (spf/dmarc) lives in a dedicated section, not here.",
      },
    ],
    faq: [
      {
        q: "why these six record types?",
        a: "they are the ones that almost every real domain has something interesting to say about. mx lives in a separate section because the email-auth group (spf, dkim, dmarc, mx) is cohesive enough to deserve its own view.",
      },
      {
        q: "do you support dnssec / caa semantics?",
        a: "caa records are returned verbatim; full dnssec chain validation is out of scope for v1. the upcoming tls and email-auth sections will surface related signals.",
      },
      {
        q: "can i use this with an agent?",
        a: "yes. the `dossier_dns` mcp tool returns the same result as a structured checkresult json payload, so an llm agent can pattern-match on status (ok / error / timeout / not_applicable) and drill into records.",
      },
      {
        q: "why not ptr / reverse dns?",
        a: "ptr lookups are bound to ip addresses, not domains. the dossier is domain-scoped; ip-centric checks belong in the ip-lookup tool.",
      },
      {
        q: "how is this different from the regular dns tool?",
        a: "the plain dns tool resolves one record type at a time and is optimised for quick ad-hoc checks. dossier/dns fans out six queries in parallel and returns a single structured result designed for composition (with tls, headers, email auth, etc.) into a domain-wide view at `/d/<domain>`.",
      },
    ],
    related: ["dns", "ip-lookup"],
    references: [
      { title: "RFC 1035 — domain names", url: "https://www.rfc-editor.org/rfc/rfc1035" },
      { title: "RFC 6844 — caa records", url: "https://www.rfc-editor.org/rfc/rfc6844" },
      { title: "RFC 8484 — dns over https (doh)", url: "https://www.rfc-editor.org/rfc/rfc8484" },
    ],
  },
  "dossier-mx": {
    lead: "list the mail exchangers (MX records) a domain advertises, sorted by priority.",
    overview:
      "mx records tell senders which smtp servers handle email for a domain. lower priority numbers win; multiple hosts at the same priority load-balance. this tool resolves the mx rrset via cloudflare's doh resolver, parses each record into (priority, exchange) pairs, and returns them sorted. it is part of the drwho.me domain dossier — the same result appears as the mx section at `/d/<domain>` and as the `dossier_mx` mcp tool.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, paths." },
      { step: "run the check", detail: "a single mx doh query against cloudflare's resolver." },
      {
        step: "read the priority list",
        detail: "lower priority is tried first. ties load-balance.",
      },
    ],
    examples: [
      {
        input: "gmail.com",
        output: "pri=5 gmail-smtp-in.l.google.com. - pri=10 alt1.gmail-smtp-in.l.google.com.",
        note: "google workspace mx set.",
      },
      {
        input: "protonmail.com",
        output: "pri=10 mail.protonmail.ch. - pri=20 mailsec.protonmail.ch.",
        note: "primary + backup pattern.",
      },
    ],
    gotchas: [
      {
        title: "no mx = no inbound smtp",
        body: "a domain with zero mx records can still send email, but cannot receive smtp traffic. the check reports not_applicable in that case.",
      },
      {
        title: "null mx (RFC 7505)",
        body: 'a single record of priority 0 pointing to "." signals "this domain does not accept mail". the tool shows it verbatim.',
      },
      {
        title: "mx aliases",
        body: "mx exchanges must be a hostname (A/AAAA), not a CNAME. some domains get this wrong; the dossier does not currently flag it — cross-reference with the dns section if a recipient bounces.",
      },
    ],
    faq: [
      {
        q: "why is there an mx section and a dns section?",
        a: "dns covers A/AAAA/NS/SOA/CAA/TXT. mx gets its own section because it's the entry point to the email-auth cluster and the ordered priority view is specific to mail.",
      },
      {
        q: "can i send mail without mx?",
        a: "yes, you can send — but you cannot receive. senders consult the recipient's mx, not yours.",
      },
      {
        q: "does this resolve the A/AAAA of each mx host?",
        a: "no. that is a second hop; use the dns tool or the dns section of a dossier for each entry if you need the address set.",
      },
      {
        q: "why is cloudflare resolving this and not google?",
        a: "cloudflare's doh responds fast and returns structured json. no tracking headers are added. the choice has no effect on the answer — mx is an authoritative record type.",
      },
      {
        q: "can i look up mx for an ip?",
        a: "no. mx is a domain-level record. ip-level lookups belong in the ip-lookup tool.",
      },
    ],
    related: ["dns", "dossier-dns"],
    references: [
      { title: "RFC 5321 — SMTP", url: "https://www.rfc-editor.org/rfc/rfc5321" },
      { title: "RFC 7505 — null MX", url: "https://www.rfc-editor.org/rfc/rfc7505" },
    ],
  },
  "dossier-spf": {
    lead: "find and parse a domain's SPF (sender policy framework) record. part of the drwho.me domain dossier.",
    overview:
      "spf (RFC 7208) lets a domain owner publish, via a single TXT record at the apex, which hosts are authorized to send mail on its behalf. the record begins with `v=spf1` and is followed by mechanisms (`include`, `a`, `mx`, `ip4`, `ip6`, `exists`, `ptr`) and a final `all` with a qualifier (`+` pass, `~` softfail, `-` fail, `?` neutral). receivers evaluate mechanisms left-to-right and apply the first match. this tool queries the TXT rrset via cloudflare's doh resolver, concatenates the quoted segments doh returns (spf strings are published as one or more 255-byte chunks), filters for the single record starting with `v=spf1`, and splits it into its mechanisms.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, paths." },
      {
        step: "run the check",
        detail: "a single TXT doh query at the apex, then filtered for `v=spf1`.",
      },
      {
        step: "read the mechanisms",
        detail:
          "left-to-right evaluation. the final `all` qualifier decides what happens to unmatched senders.",
      },
    ],
    examples: [
      {
        input: "google.com",
        output: "v=spf1 include:_spf.google.com ~all",
        note: "google workspace delegates its sender set through a single include.",
      },
      {
        input: "github.com",
        output:
          "v=spf1 ip4:192.30.252.0/22 include:_spf.google.com include:spf.protection.outlook.com -all",
        note: "mixes an explicit ip4 range with two includes and a hard fail.",
      },
    ],
    gotchas: [
      {
        title: "multiple spf records are forbidden",
        body: "RFC 7208 §3.2 requires exactly one `v=spf1` TXT record at the apex. some operators split policies into two records thinking it helps — receivers are required to treat that as permerror. this tool reports it as an error.",
      },
      {
        title: "10-DNS-lookup limit",
        body: "each `include`, `a`, `mx`, `exists`, `ptr`, and `redirect` costs one dns lookup during evaluation. the total across the whole record (including nested includes) must stay at or below 10, or receivers return permerror. this tool surfaces the record but does not yet walk includes to count lookups.",
      },
      {
        title: "`~all` vs `-all` vs `?all`",
        body: "`-all` is a hard fail — receivers should reject. `~all` is a softfail — accept but mark suspicious. `?all` is neutral — no opinion. `+all` is authorize-everything and is almost always wrong. dmarc policy amplifies whichever you pick.",
      },
    ],
    faq: [
      {
        q: "why does the tool flag multiple spf records as an error?",
        a: "RFC 7208 §3.2 forbids it. conformant receivers treat multi-record cases as permerror, so mail from the domain may fail delivery until it's collapsed into one.",
      },
      {
        q: "does spf alone stop spoofing?",
        a: "no. spf authenticates the envelope sender (RFC 5321 MAIL FROM), not the visible From: header. pairing spf with dkim and publishing a dmarc policy is what closes the gap.",
      },
      {
        q: "what if the record is split across quoted segments?",
        a: 'doh returns long TXT values as multiple quoted strings separated by whitespace; the spec says receivers must concatenate them with no separator. the tool does that before parsing, so `"v=spf1 include:_spf.google.com " "-all"` becomes `v=spf1 include:_spf.google.com -all`.',
      },
      {
        q: "why is `ptr` considered harmful?",
        a: "`ptr` forces the receiver to do reverse-dns on the connecting ip, which is slow and unreliable. RFC 7208 explicitly discourages it. prefer `ip4`/`ip6` ranges or `include`.",
      },
      {
        q: "can a subdomain have its own spf record?",
        a: "yes. spf is checked at whatever name appears in the MAIL FROM, so a subdomain publishes its own TXT. this tool checks the apex you entered — query `mail.example.com` directly if that's the sender.",
      },
    ],
    related: ["dns", "dossier-dns", "dossier-mx"],
    references: [
      { title: "RFC 7208 — SPF", url: "https://www.rfc-editor.org/rfc/rfc7208" },
      { title: "dmarc.org — SPF overview", url: "https://dmarc.org/wiki/SPF" },
    ],
  },
  "dossier-dmarc": {
    lead: "find and parse a domain's DMARC (domain-based message authentication, reporting, and conformance) policy record. part of the drwho.me domain dossier.",
    overview:
      "dmarc (RFC 7489) is a TXT record published at `_dmarc.<domain>` that tells receivers what to do with mail that fails spf or dkim alignment, and where to send aggregate and forensic reports. the policy tag `p=` picks one of three actions: `none` (monitor only — deliver, just send reports), `quarantine` (route to spam), or `reject` (refuse at smtp). alignment is tuned with `adkim` and `aspf` (`r` relaxed — organisational-domain match — or `s` strict — exact fqdn match). `rua` addresses receive daily aggregate reports; `ruf` addresses receive per-message forensic reports. `pct` gates a gradual rollout by percentage, and `sp` applies a distinct policy to subdomains. this tool queries `_dmarc.<domain>` via cloudflare's doh resolver, insists on exactly one `v=DMARC1` record per RFC 7489, and splits the semicolon-separated `k=v` pairs into a tag map.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, paths." },
      {
        step: "run the check",
        detail:
          "a single TXT doh query at `_dmarc.<domain>`, not the apex. dmarc records never live at the apex.",
      },
      {
        step: "read the policy + alignment",
        detail:
          "`p` is the enforcement level, `adkim`/`aspf` tune alignment strictness, `rua`/`ruf` are the reporting addresses, and `pct` gates rollout.",
      },
    ],
    examples: [
      {
        input: "google.com",
        output:
          "v=DMARC1; p=reject; rua=mailto:mailauth-reports@google.com - policy reject, aggregate reports - relaxed alignment defaults",
        note: "google enforces reject and collects aggregate reports; no forensic (`ruf`) subscription.",
      },
      {
        input: "microsoft.com",
        output:
          "v=DMARC1; p=reject; pct=100; rua=mailto:d@rua.agari.com; ruf=mailto:d@ruf.agari.com; fo=1 - full reject - 100% rollout - both rua and ruf reporting",
        note: "microsoft uses agari as its report aggregator and opts into per-message forensic feedback.",
      },
    ],
    gotchas: [
      {
        title: "dmarc requires spf OR dkim to align",
        body: "dmarc does not authenticate mail on its own. it only enforces alignment between the visible From: header and an already-passing spf or dkim check. publishing a dmarc record without a working spf or dkim setup means every message fails dmarc regardless of policy.",
      },
      {
        title: "`p=none` is monitor-only",
        body: "many domains stop at `p=none` and assume they have dmarc protection. they don't — `none` only tells receivers to report, not to block or quarantine. spoofed mail still lands in the inbox. move to `quarantine` and then `reject` once reports show legitimate sources are all aligned.",
      },
      {
        title: "external `rua`/`ruf` mailboxes need authorisation",
        body: "if your `rua=mailto:` address is in a different domain than the policy domain, the receiving domain must publish `<your-domain>._report._dmarc.<their-domain>` TXT=`v=DMARC1` to opt in. miss this and reporters drop your aggregate reports silently.",
      },
    ],
    faq: [
      {
        q: "why does the tool query `_dmarc.<domain>` and not the apex?",
        a: "RFC 7489 §6.1 places the dmarc record at the `_dmarc` label under the policy domain, not at the apex. the apex TXT is where spf lives; putting dmarc there would collide with spf parsers.",
      },
      {
        q: "what's the difference between `adkim=r` and `adkim=s`?",
        a: "relaxed (`r`) accepts any subdomain under the same organisational domain — e.g. `mail.example.com` aligned with From: `example.com`. strict (`s`) requires an exact fqdn match. `aspf` works the same way for spf alignment.",
      },
      {
        q: "does `p=reject` mean receivers must reject?",
        a: "receivers are advised to reject, but dmarc is a policy signal, not a mandate. large mailbox providers (gmail, outlook) honor it; some smaller operators ignore it entirely. `pct` can gate rollout — `p=reject; pct=10` means only 10% of failing mail is rejected; the rest falls back to the `sp` or `quarantine` treatment.",
      },
      {
        q: "can subdomains have their own dmarc policy?",
        a: "yes. a subdomain may publish its own `_dmarc.sub.example.com` TXT, which overrides the parent. if it doesn't, receivers inherit the parent's policy but apply the `sp` tag instead of `p` when scoring the subdomain.",
      },
      {
        q: "what's `fo` for?",
        a: "`fo` controls when forensic reports fire: `0` (default) = report only on total dmarc failure; `1` = report when any auth check fails; `d` = dkim failure; `s` = spf failure. it only matters if you publish a `ruf` address.",
      },
    ],
    related: ["dns", "dossier-dns", "dossier-mx", "dossier-spf"],
    references: [
      { title: "RFC 7489 — DMARC", url: "https://www.rfc-editor.org/rfc/rfc7489" },
      { title: "RFC 8617 — ARC", url: "https://www.rfc-editor.org/rfc/rfc8617" },
    ],
  },
  "dossier-dkim": {
    lead: "probe common DKIM selectors for a domain and surface the public-key TXT record. part of the drwho.me domain dossier.",
    overview:
      "dkim (RFC 6376) signs outgoing mail with a per-sender private key; receivers verify by fetching the matching public key at `<selector>._domainkey.<domain>`. unlike spf or dmarc, dkim has no canonical record location — each sender picks its own `selector` label, and the selector in use is announced per-message via the `DKIM-Signature: s=...` header tag. there is no public-dns api to enumerate a domain's selectors, so this tool probes a fixed list of common defaults in parallel: `default`, `google` (google workspace / gmail), `k1` (mailchimp / mandrill), `selector1` and `selector2` (microsoft 365 rotate between them), and `mxvault` (mxroute). each probe is a TXT doh lookup; a selector is reported as `found` if the record starts with `v=DKIM1` or with a bare `p=` (RFC 8301 minimum marker). supply `selectors=[...]` to the `dossier_dkim` MCP tool to override the defaults.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, paths." },
      {
        step: "run the check",
        detail:
          "six TXT doh queries fire in parallel, one per default selector at `<selector>._domainkey.<domain>`.",
      },
      {
        step: "read the selector table",
        detail:
          "each probed selector appears as a row: `found` with the record, or `not_found` with a dash. a domain typically publishes one or two selectors.",
      },
      {
        step: "find an unlisted selector",
        detail:
          "inspect a recently received email from the domain. the `DKIM-Signature:` header contains a `s=...` tag naming the selector actually in use — pass it via the MCP tool's `selectors` argument.",
      },
    ],
    examples: [
      {
        input: "gmail.com",
        output: "google - v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG... - other probed selectors not_found",
        note: "google workspace publishes a single `google` selector at the apex.",
      },
      {
        input: "mailchimp.com",
        output:
          "k1 - v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN... - other probed selectors not_found",
        note: "mailchimp signs with the `k1` selector across every customer domain.",
      },
    ],
    gotchas: [
      {
        title: "no public-dns enumeration",
        body: "dns cannot list a domain's selectors. this tool probes a fixed common set — if a sender uses a bespoke selector (e.g. `20230601`, `s1024`, `smtpapi`), the default probe will report `not_found` for every slot even though dkim is fully configured. always cross-check against a real message's `DKIM-Signature: s=` tag before concluding dkim is missing.",
      },
      {
        title: "key rotation leaves old selectors behind",
        body: "senders rotate keys by publishing a new selector and cutting traffic over. the old selector's TXT record often lingers for months so in-flight mail can still verify. seeing two selectors `found` usually means a rotation is in progress, not a misconfiguration.",
      },
      {
        title: "selectors frequently point at CNAMEs",
        body: "a domain delegating mail to a provider (google workspace, sendgrid, mailchimp) typically publishes the `<selector>._domainkey` label as a CNAME into the provider's zone, not a direct TXT. doh resolvers follow the CNAME transparently, so this tool just sees the final TXT — but the control of the key lives with the provider, not the domain owner.",
      },
    ],
    faq: [
      {
        q: "why these six selectors?",
        a: "they cover the largest mail platforms by volume: `default` (generic fallback), `google` (google workspace / gmail), `k1` (mailchimp / mandrill), `selector1` + `selector2` (microsoft 365, which rotates between the two), and `mxvault` (mxroute). a domain that uses any other sender will likely come back all-`not_found` — that's expected.",
      },
      {
        q: "can i supply a selector?",
        a: "yes. the `dossier_dkim` MCP tool accepts `selectors=[...]`. pass the exact selector name you want to probe and only those labels are queried. the web ui probes the default set; use the mcp endpoint for custom probes.",
      },
      {
        q: "what does `found` actually require?",
        a: "a TXT record at `<selector>._domainkey.<domain>` whose value starts with `v=DKIM1` or contains a `p=` tag (the public-key marker). RFC 8301 permits omitting `v=DKIM1` on records that only carry the key, so we accept a bare `p=` prefix as well.",
      },
      {
        q: "what does `not_found` mean — no record, or no dkim?",
        a: "only that this specific selector has no TXT at the expected label. absence across all six common selectors is not proof dkim is missing — see the first gotcha about bespoke selector names.",
      },
      {
        q: "why is this slower than spf/dmarc?",
        a: "it fires six doh queries instead of one. they run in parallel under a single 5-second abort controller, so the wall-clock cost is close to a single query when the resolver is responsive.",
      },
    ],
    related: ["dns", "dossier-dns", "dossier-spf", "dossier-dmarc"],
    references: [
      { title: "RFC 6376 — DKIM Signatures", url: "https://www.rfc-editor.org/rfc/rfc6376" },
      {
        title: "RFC 8301 — DKIM Cryptographic Algorithms",
        url: "https://www.rfc-editor.org/rfc/rfc8301",
      },
    ],
  },
  "dossier-tls": {
    lead: "inspect a domain's TLS certificate served on port 443 - subject, issuer, validity, SANs, sha256 fingerprint. part of the drwho.me domain dossier.",
    overview:
      "tls (RFC 8446 for 1.3, RFC 5246 for 1.2) wraps tcp with an x.509 certificate chain so clients can authenticate the server and negotiate an encrypted channel. this tool opens a raw tls socket to `<domain>:443`, completes the handshake with SNI set to the requested domain, reads the peer certificate (the leaf, not the intermediates), and closes. we report the leaf's subject common-name, issuer common-name and organization, `valid_from` -> `valid_to` window, any `subjectAltName` DNS entries, and the sha256 fingerprint. browsers validate the full chain against a trust store; we deliberately pass `rejectUnauthorized: false` so we can surface an expired, self-signed, or hostname-mismatched certificate as data (`authorized: false` plus the openssl error code) instead of refusing the handshake. the dominant public CA today is Let's Encrypt via ACME (RFC 8555) which issues 90-day certs for free; SaaS platforms (Vercel, Cloudflare, Fly) proxy that for you. v1 scope is the peer cert only - we do NOT walk the chain, check OCSP, or probe weak ciphers; use sslyze or testssl.sh for the full audit surface.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, paths." },
      {
        step: "open the tls socket",
        detail:
          "the tool connects to port 443 with servername=<domain> (SNI). the handshake has a 5s timeout end to end.",
      },
      {
        step: "read the certificate card",
        detail:
          "subject, issuer, validity window, SAN list, and sha256 fingerprint all render after the handshake. `authorized: yes` means the cert verified against node's trust store; `no` surfaces the openssl error code (e.g. `CERT_HAS_EXPIRED`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE`).",
      },
      {
        step: "cross-check SAN coverage",
        detail:
          "browsers match the requested hostname against the SAN list - never against subject CN. if the hostname you used is missing from SANs, the cert is not valid for that name even if `authorized` says yes (node's match happens against `servername` which we set to the input domain).",
      },
    ],
    examples: [
      {
        input: "drwho.me",
        output:
          "subject CN=drwho.me, issuer=R3 / Let's Encrypt, valid 90 days, SAN=[drwho.me, www.drwho.me], authorized=yes",
        note: "vercel-hosted app - Let's Encrypt via ACME, rotated every ~60 days.",
      },
      {
        input: "google.com",
        output:
          "subject CN=*.google.com, issuer=WR2 / Google Trust Services, valid ~90 days, SAN includes google.com + many wildcards, authorized=yes",
        note: "google runs its own public CA (google trust services) and signs its own wildcard certs.",
      },
    ],
    gotchas: [
      {
        title: "expired cert is a soft signal",
        body: "we report `authorized: false` with `CERT_HAS_EXPIRED` but still return the cert fields so you can see WHAT expired. a browser refuses the connection outright; our tool does not, because seeing the cert is often the whole point of the check. expiration within the next 14 days is a common monitoring threshold - many acme renewals cut over in the last 30 days.",
      },
      {
        title: "SNI is required - no SNI, no cert",
        body: "modern CDNs (cloudfront, fastly, vercel) host thousands of certs on a single IP and pick the right one from the `servername` sent in the ClientHello. we set servername=<domain> so you get the cert you asked about; a plain `openssl s_client -connect ip:443` without `-servername` would usually get a default/placeholder cert instead.",
      },
      {
        title: "port 443 only - no starttls, no non-web tls",
        body: "this tool only probes https on 443. imap (993), smtp submission (465/587 STARTTLS), and postgres TLS all serve their own cert chains on other ports. use `openssl s_client -starttls smtp -connect host:587` for those - scope is intentionally narrow here.",
      },
    ],
    faq: [
      {
        q: "why `rejectUnauthorized: false` - isn't that insecure?",
        a: "we're inspecting the cert, not using the connection to send secrets. refusing the handshake on a cert error would leave us unable to SHOW the expired/self-signed cert - which defeats the tool. we surface `authorized` as a field in the output so consumers can still see the verdict. this is the same rationale chrome's `NET::ERR_CERT_DATE_INVALID` interstitial uses: show the error, but let the user see what's there.",
      },
      {
        q: "do you walk the full chain?",
        a: "no - v1 only reports the leaf. walking the chain means fetching each intermediate (often via Authority Information Access), re-verifying signatures, and cross-checking against the system trust store. use sslyze or ssllabs.com for that; we keep scope tight to one tcp round trip.",
      },
      {
        q: "what does the sha256 fingerprint tell me?",
        a: "it's the hex-uppercased sha256 of the der-encoded certificate. use it for cert pinning or to confirm two deployments are serving the exact same cert. any one-bit change in the cert (new validity window, rotated key) produces a totally different fingerprint.",
      },
      {
        q: "why is google.com's SAN list so long?",
        a: "large providers mint one cert that covers many product hostnames (`*.google.com`, `*.youtube.com`, etc.) to avoid the operational cost of per-host certs. this is allowed by RFC 5280 but increases the blast radius if the private key is ever compromised - one revocation nukes every hostname on the cert.",
      },
      {
        q: "why is a Let's Encrypt cert only valid 90 days?",
        a: "short validity forces automation (certbot, traefik, caddy, acme.sh), which means revocations propagate fast and operational mistakes self-heal on the next renewal. Let's Encrypt published the rationale in 2015 and the whole acme ecosystem now defaults to it; Apple's trust store is even moving toward a 45-day max in 2027.",
      },
    ],
    related: ["dns", "dossier-dns", "dossier-mx"],
    references: [
      {
        title: "RFC 5280 — Internet X.509 Public Key Infrastructure",
        url: "https://www.rfc-editor.org/rfc/rfc5280",
      },
      {
        title: "RFC 6066 — TLS Extensions (SNI)",
        url: "https://www.rfc-editor.org/rfc/rfc6066",
      },
    ],
  },
  "dossier-redirects": {
    lead: "trace the HTTP redirect chain from https://<domain>/ — every 301/302/307/308 hop, up to a 10-hop cap. part of the drwho.me domain dossier.",
    overview:
      "HTTP redirects (RFC 9110 §15.4) are how servers tell a client 'not here, go there' via a 3xx status + `Location` header. the common cases: 301 (moved permanently — cache it), 302 (found — don't cache), 307 (temporary redirect preserving method + body), 308 (permanent redirect preserving method + body). this tool issues a `GET https://<domain>/` with `redirect: manual` and walks the `Location` chain by hand, recording `{url, status}` for each hop, stopping on the first non-3xx response or when the 10-hop cap is hit. relative Locations are resolved against the current URL (so `/foo` after `https://a.example/` becomes `https://a.example/foo`). we deliberately start at `https://` — if you want to see the HTTP -> HTTPS upgrade, some hosts serve it as a real 301, others rely on HSTS preloading (which is invisible to this probe because the browser upgrades before the request leaves). common chains: apex -> www (`example.com` -> `www.example.com`), tracking-style path rewrites (`/?utm=...` -> `/`), locale detection (`/en`), auth gates (`/` -> `/login`). a 10-hop cap catches most real-world misconfigurations (classic: `a` redirects to `b`, `b` redirects back to `a`) while still finishing well under the 5s timeout budget.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, or paths." },
      {
        step: "read the chain",
        detail:
          "each hop shows `[status] url`. the first row is always `https://<your-domain>/`; subsequent rows come from the `Location` header of the previous response.",
      },
      {
        step: "look at final status",
        detail:
          "the final status is the first non-3xx response the chain lands on — typically 200 (ok), 404 (not found), or 403 (forbidden). if the chain stops on a 3xx with no `Location`, or exceeds 10 hops, we report an error instead.",
      },
    ],
    examples: [
      {
        input: "google.com",
        output:
          "chain: `https://google.com/` (301) -> `https://www.google.com/` (200). classic apex -> www redirect.",
        note: "two hops, final 200. the apex is a pure redirector — `www` hosts the actual app.",
      },
      {
        input: "bit.ly/<short>",
        output:
          "one 301 hop to the target URL, final 200 on the destination page. link shorteners are the canonical redirect use case.",
        note: "some shorteners add tracking hops (e.g. via doubleclick) before landing.",
      },
    ],
    gotchas: [
      {
        title: "we start at https:// — no http upgrade visible",
        body: "this tool always starts at `https://<domain>/`. sites that serve a literal `http://` -> `https://` 301 won't show it here because we never issue the plain http request. HSTS-preloaded domains never emit that redirect at all (the browser upgrades before the request leaves), so this is a less useful signal than it looks.",
      },
      {
        title: "first-hop TLS failure surfaces as a network error, not a redirect error",
        body: "if the https handshake itself fails (expired cert, self-signed, wrong SAN), `fetch` throws before any status is observed, so you'll see `error: <openssl code>` rather than an empty chain. use dossier-tls first when the redirects probe errors out with a TLS-shaped message.",
      },
      {
        title: "cookies and auth can change the chain",
        body: "we send no cookies, no auth header, and a fixed `User-Agent`. a site that varies its redirect on a logged-in session (e.g. `/` -> `/dashboard` for authed users, `/` -> `/login` for anons) will show you the anon path only. the chain a real browser sees may be shorter or longer.",
      },
    ],
    faq: [
      {
        q: "why a 10-hop cap?",
        a: "browsers cap at ~20 hops (chrome = 20, firefox = 20); 10 is already well past every legitimate chain we've seen. the cap exists to catch loops — sites that redirect `a` -> `b` -> `a` forever — and surface them as `redirect cap exceeded` rather than hanging until the 5s timeout.",
      },
      {
        q: "301 vs 302 vs 307 vs 308 — which should i use?",
        a: "301 (permanent, may rewrite method) and 302 (temporary, may rewrite method) are the classic pair — but 'may rewrite method' means a POST often becomes a GET on the next hop, which is why the HTTP/1.1 WG added 307 (temporary, preserve method + body) and 308 (permanent, preserve method + body). for apex -> www, use 301 for cacheability; for `/` -> `/login` gates, use 302 or 307. RFC 9110 §15.4 lays out the full matrix.",
      },
      {
        q: "do we follow cross-scheme redirects (https -> http)?",
        a: "yes — the loop has no scheme policy, it just follows `Location`. in practice https -> http is a security smell (you're about to leak the rest of the session over plaintext) and most modern browsers block it. if you see it in the chain, treat it as a bug on the server side.",
      },
      {
        q: "what if the server returns 301 with no `Location` header?",
        a: "RFC 9110 requires `Location` on all 3xx responses that aren't 304. a 301 without one is a spec violation; we report `redirect 301 with no Location header` as an error rather than guess where to go next.",
      },
      {
        q: "why not use `redirect: 'follow'` and let fetch handle it?",
        a: "because then you only see the final URL, not the chain. `redirect: manual` is the only way to record every `{url, status}` pair. it's the same reason curl has `-L --max-redirs N -w '%{url_effective}\\n'` — you pick manual when the chain IS the data.",
      },
    ],
    related: ["dns", "dossier-dns", "dossier-tls"],
    references: [
      {
        title: "RFC 9110 §15.4 — Redirection 3xx",
        url: "https://www.rfc-editor.org/rfc/rfc9110#section-15.4",
      },
      {
        title: "MDN — HTTP Redirections",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections",
      },
    ],
  },
  "dossier-headers": {
    lead: "inspect the response headers served at https://<domain>/ — HSTS, CSP, X-Frame-Options, and the rest of the security crew. part of the drwho.me domain dossier.",
    overview:
      "response headers are how a server tells a browser how to treat a page: cache it, frame it, execute which scripts, upgrade future requests to https, and so on. the six headers this tool highlights as `security headers` are the modern defensive set — `strict-transport-security` (HSTS: force https for a max-age window, optionally joining the preload list with `max-age=63072000; includeSubDomains; preload`), `content-security-policy` (CSP: a per-directive allowlist of script/style/img/connect sources, the single biggest lever against XSS when a `nonce` or `strict-dynamic` is in play), `x-frame-options` (DENY/SAMEORIGIN — clickjacking protection, largely superseded by CSP's `frame-ancestors`), `x-content-type-options` (`nosniff` — disable MIME sniffing so a rogue image can't be interpreted as javascript), `referrer-policy` (what gets leaked in the `Referer` header on outbound navigations; `strict-origin-when-cross-origin` is the safe default), `permissions-policy` (formerly `feature-policy` — opt-out of geolocation, camera, mic, etc. per-origin). this tool issues a single `GET https://<domain>/` with `redirect: follow`, collects every response header into a lowercased map, and renders the security set first with `—` where absent, then the remaining headers sorted alphabetically. CSP tradeoff worth calling out: a perfect CSP is restrictive enough to break obvious XSS but permissive enough to not break analytics, A/B tests, third-party widgets — most real-world CSPs either include `'unsafe-inline'` (and provide almost no XSS protection) or use a per-request nonce injected by the server. there's no middle ground that's both safe and cheap.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, or paths." },
      {
        step: "read the security headers block",
        detail:
          "six rows, one per defensive header. a `—` means the server doesn't send that header at all — not that it's misconfigured, just absent. an HSTS row with `max-age=0` means the site is actively un-preloading itself; with `max-age=31536000; includeSubDomains; preload` it's on the long-term preload roadmap.",
      },
      {
        step: "scan the other headers for signals",
        detail:
          "`server` and `x-powered-by` tell you the stack (nginx, cloudflare, vercel, express). `cache-control` reveals CDN strategy. `set-cookie` shows session naming (and whether `Secure` / `HttpOnly` / `SameSite` are set). `alt-svc` advertises HTTP/3. treat it as reconnaissance for the rest of the dossier.",
      },
    ],
    examples: [
      {
        input: "github.com",
        output:
          "hardened: `strict-transport-security: max-age=31536000; includeSubDomains; preload`, a long CSP with nonces, `x-frame-options: deny`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy` covering dozens of features. a useful baseline for what 'taking security headers seriously' looks like.",
        note: "GitHub has been on the HSTS preload list since 2015. the CSP even ships separate `content-security-policy-report-only` rules for monitoring new directives before enforcing.",
      },
      {
        input: "example.com",
        output:
          "a plain apex: likely no HSTS, no CSP, no frame-options — just `content-type`, `cache-control`, `date`, `server`. all six security rows render `—`. perfectly functional for IANA's documentation domain, but 0/6 on the hardening score.",
        note: "not every site needs a CSP; a static doc page with no user-content isn't an XSS target. context matters.",
      },
    ],
    gotchas: [
      {
        title: "we probe `/` only — headers can differ per path",
        body: "a site's CSP on `/` (login page, small allowlist) is often tighter than its CSP on `/app` (full app, wider allowlist) or its CSP on `/static/*` (probably just `default-src 'none'`). this tool fetches exactly `https://<domain>/`, so what you see is the landing-page policy. to audit a specific path, use `curl -sI https://<domain>/<path>` directly.",
      },
      {
        title: "CDN headers can mask (or add to) origin headers",
        body: "cloudflare, fastly, akamai and friends can strip, rewrite, or append headers at the edge. a `server: cloudflare` + `cf-ray` combo means you're seeing CF's composite response, not your origin's raw output. headers like `strict-transport-security` may be CF-injected even if the origin doesn't set them. check CF's 'transform rules' or 'response headers' tab to confirm what's origin vs edge.",
      },
      {
        title: "HSTS without `preload` doesn't join the preload list",
        body: "the `preload` token is necessary but not sufficient — you also have to submit the domain to https://hstspreload.org and ship `includeSubDomains` + `max-age>=31536000`. shipping `max-age=31536000; preload` without submitting changes nothing in chrome/firefox/safari. conversely, once preloaded, removing the header doesn't un-preload you; removal requires a separate request to the list maintainer.",
      },
    ],
    faq: [
      {
        q: "which security headers matter most in 2026?",
        a: "in order of impact-per-effort: (1) HSTS with a year-plus max-age, (2) a strict CSP using nonces or `strict-dynamic` — this is the only XSS control that actually works, (3) `x-content-type-options: nosniff`, (4) `referrer-policy: strict-origin-when-cross-origin`. `x-frame-options` is largely redundant if your CSP includes `frame-ancestors`; `permissions-policy` is high-value only for sites that actually request camera/mic/geolocation permissions.",
      },
      {
        q: "why is my CSP showing `unsafe-inline` — is that bad?",
        a: "yes. `'unsafe-inline'` defeats the primary purpose of CSP because an XSS payload can just use an inline `<script>` tag or `onerror=` handler and bypass the allowlist. modern CSPs use a per-request nonce (`script-src 'nonce-<random>'`) or `strict-dynamic` to allow specific scripts without a blanket escape hatch. if you can't remove `'unsafe-inline'` without breaking the site, you haven't really deployed a CSP — you've deployed a policy theater.",
      },
      {
        q: "does this tool send cookies or auth?",
        a: "no. we send no cookies, no `Authorization`, and a fixed `User-Agent: drwho-dossier/1.0`. some sites vary their security headers based on auth state (e.g. a more restrictive CSP for logged-in users' sensitive pages), so the anon response you see here may differ from what a real session receives.",
      },
      {
        q: "what's a good CSP max-age?",
        a: "CSP itself has no max-age. you're thinking of HSTS. for HSTS: `max-age=31536000` (1 year) is the preload minimum; `max-age=63072000` (2 years) is the common production setting. lower max-ages defeat HSTS's purpose (an attacker only needs to feint-out for a few seconds to serve a downgraded response before a short TTL expires).",
      },
      {
        q: "why `redirect: follow` here but `redirect: manual` in dossier-redirects?",
        a: "different questions. dossier-redirects wants the chain as data (every hop's url + status), so it walks manually. dossier-headers wants the headers of whatever page a browser would actually land on, so it lets fetch follow the chain and reports the final URL + its headers. if you want both — walk the chain AND inspect headers at each hop — run both tools side-by-side.",
      },
    ],
    related: ["dns", "dossier-redirects", "dossier-tls"],
    references: [
      {
        title: "MDN — HTTP security headers (Security on the web)",
        url: "https://developer.mozilla.org/en-US/docs/Web/Security",
      },
      {
        title: "Mozilla Observatory — grader for HTTP security headers",
        url: "https://observatory.mozilla.org/",
      },
    ],
  },
  "dossier-cors": {
    lead: "send a CORS preflight (OPTIONS) to https://<domain>/ with an `Origin` and `Access-Control-Request-Method`, then surface the `access-control-*` response headers. part of the drwho.me domain dossier.",
    overview:
      "CORS (cross-origin resource sharing) is how a server tells a browser which cross-origin pages are allowed to read its responses. before any non-simple request the browser issues a preflight `OPTIONS` carrying `Origin: <caller>` and `Access-Control-Request-Method: <method>` (plus `Access-Control-Request-Headers` if any non-simple headers will be sent), and the server responds with a matching set of `Access-Control-Allow-*` headers: `Allow-Origin` (either `*` or the echoed origin — never a list), `Allow-Methods`, `Allow-Headers`, optional `Allow-Credentials: true` (which is *incompatible* with `Allow-Origin: *` — the browser will reject the response), `Max-Age` (how long the preflight can be cached), and `Expose-Headers` (which response headers become readable to JS beyond the CORS-safelisted set). this tool fires exactly that preflight with `Origin` defaulting to `https://drwho.me` and method defaulting to `GET`, and renders the six AC-* headers side by side. if none come back, the site does not advertise CORS to that origin — which is the common case for sites that are consumed only by their own frontend.",
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, or paths." },
      {
        step: "(optional) set a custom origin and method",
        detail:
          "CORS responses commonly vary by the requesting `Origin` — a server may echo `Access-Control-Allow-Origin` only for allowlisted origins. similarly `POST` or `PUT` may be denied where `GET` is allowed. supply `origin` and `method` via the MCP tool to probe those branches.",
      },
      {
        step: "read the AC-* block",
        detail:
          "`—` means the header is absent. `Allow-Origin: *` is a public API signal; an echoed origin (e.g. `https://drwho.me`) means the server has an allowlist and this origin passed. `Allow-Credentials: true` combined with a specific (non-`*`) origin means cookie-carrying cross-site requests are permitted.",
      },
    ],
    examples: [
      {
        input: "api.github.com",
        output:
          "GitHub's REST API returns a permissive public CORS set: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE`, `Access-Control-Expose-Headers: ETag, Link, Location, Retry-After, X-GitHub-*, X-RateLimit-*`. designed for browser-side use without credentials.",
        note: "because origin is `*`, credentials are by spec disallowed. authenticated calls must use `Authorization: Bearer ...`, not cookies.",
      },
      {
        input: "example.com",
        output:
          "a plain static site: all six AC-* rows render `—`. the preflight itself returns 200 or 405, but no CORS headers come back. the muted note reads: `no access-control-* headers returned — site does not advertise CORS to this origin`.",
        note: "this is the correct default — absence of CORS is a deny, not an allow. a browser cross-origin fetch will fail at the response-read step.",
      },
    ],
    gotchas: [
      {
        title: "a 2xx on OPTIONS does not imply CORS is configured",
        body: "many servers respond 200/204 to an `OPTIONS /` request out of the box (nginx, apache, node frameworks) — sometimes returning the same HTML as `GET`. a 2xx preflight status with zero `access-control-*` headers means exactly the same thing as a 405: CORS is not advertised. always look at the headers, not the status code.",
      },
      {
        title: "`Access-Control-Allow-Origin: *` with `Allow-Credentials: true` is invalid",
        body: "the CORS spec forbids this combination. browsers will drop the response — not just the `Allow-Credentials` line — and the fetch rejects. servers intending to support cookie-bearing cross-site calls must echo the specific origin back, maintain a per-request allowlist, and include `Vary: Origin` in the response so caches don't cross-pollinate.",
      },
      {
        title: "some CDNs require the preflight method to match a real endpoint",
        body: "cloudflare, cloudfront, and fastly sometimes pass OPTIONS through to the origin unmodified — the origin then 404s because it has no route for `OPTIONS /some/api`. the fix at the edge is an `Access-Control-Request-Method`-aware rule that short-circuits with the correct AC-* headers. if your preflight succeeds on `/` but a browser call to `/api/v1/x` fails, the CDN rule probably only covers `/`.",
      },
    ],
    faq: [
      {
        q: "what's the difference between `*` and an echoed origin?",
        a: "`Access-Control-Allow-Origin: *` means 'any website may read this response, without credentials'. an echoed origin (the server copies the request's `Origin` header into the response) means 'this specific origin is allowed'. the echoed form is required any time you want to allow cookies/auth (`Access-Control-Allow-Credentials: true`). the echoed form also requires the server to include `Vary: Origin` so intermediary caches keyed by URL don't hand one origin's response to another.",
      },
      {
        q: "why doesn't every cross-origin request send a preflight?",
        a: "only non-simple requests do. a request is *simple* (no preflight) when the method is GET/HEAD/POST, the only custom headers are CORS-safelisted (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type` limited to `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`), and there's no ReadableStream upload. anything else — `PUT`, `DELETE`, `Content-Type: application/json`, a custom `X-Foo` header — triggers the preflight.",
      },
      {
        q: "my call works from curl but fails from the browser — why?",
        a: "curl doesn't enforce CORS; it's purely a browser security model. the server is responding fine at the HTTP layer, but the browser sees the AC-* headers (or the lack of them) and rejects the response before JS can read it. this tool probes exactly what the browser sees.",
      },
      {
        q: "what's `Access-Control-Max-Age` for?",
        a: "it tells the browser how long (in seconds) it can cache this preflight result, keyed by URL + method + headers. `Max-Age: 86400` means 'don't re-preflight for 24 hours'. chrome caps this at 2 hours, firefox at 24 hours. omitting it means every non-simple cross-origin request is preceded by its own preflight round-trip — a real perf cost on chatty APIs.",
      },
      {
        q: "does this tool send cookies or auth?",
        a: "no. we send a fixed `User-Agent: drwho-dossier/1.0`, the `Origin` header, and `Access-Control-Request-Method`. no cookies, no `Authorization`. servers that vary CORS by auth state (e.g. a tighter allowlist for anonymous users) will show you the anonymous variant.",
      },
    ],
    related: ["dossier-headers", "dossier-redirects", "dossier-dns"],
    references: [
      {
        title: "Fetch Standard §3.2 — CORS protocol",
        url: "https://fetch.spec.whatwg.org/#http-cors-protocol",
      },
      {
        title: "MDN — Cross-Origin Resource Sharing (CORS)",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
      },
    ],
  },
  "dossier-web-surface": {
    lead: "fetch robots.txt, sitemap.xml, and the home page's <head> in parallel to summarise the public web surface a domain advertises. part of the drwho.me domain dossier.",
    overview:
      'three signals, one glance. `robots.txt` at the domain root declares crawler rules (which user-agents may fetch which paths) — its presence and contents hint at indexability intent. `sitemap.xml` (or a linked `sitemap_index.xml`) enumerates the URLs a site wants indexed; the count of `<loc>` entries is a crude measure of site footprint. the home-page `<head>` carries the visible-to-search-and-social-previews metadata: the `<title>`, the `<meta name="description">`, the OpenGraph (`og:*`) set used by facebook/linkedin/slack link unfurls, and the twitter card (`twitter:*`) set. this tool issues three parallel GETs with a shared 5s timeout, truncates bodies for safety (4KB for robots, 64KB for head), and does best-effort regex extraction — not a full HTML parser. if the home page fails, the whole check errors; robots and sitemap are treated as optional and silently marked absent on non-2xx or connection errors.',
    howTo: [
      { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, or paths." },
      {
        step: "read robots / sitemap as indexability signals",
        detail:
          "presence of both is what a well-SEO'd content site looks like. a landing page may have neither — that's fine, it just means crawlers get no explicit guidance and the home page alone is the indexable surface. click the robots `<details>` to inspect the first 4KB of rules.",
      },
      {
        step: "inspect the OG / Twitter block for social previews",
        detail:
          "when you paste a URL into slack/discord/linkedin/twitter, the unfurl card is built from `og:title`, `og:description`, `og:image`, and `twitter:card`. missing `og:image` means a link to this page will render as a plain text row with no thumbnail. missing `twitter:card` defaults to `summary` in most clients — fine for text-heavy pages, bad for marketing pages.",
      },
    ],
    examples: [
      {
        input: "github.com",
        output:
          'robots.txt: present (standard crawl-rules for google/bing/etc). sitemap.xml: present, a sitemap-index with thousands of sub-sitemaps (this tool reports the top-level `<loc>` count, not the recursed total). head: title "GitHub · Build and ship software on a single, collaborative platform", full OG set with `og:image`, `twitter:card: summary_large_image`. a textbook content-heavy site.',
        note: "when the root sitemap is itself an index file, the `urlCount` number underrepresents the real URL surface — the tool does not recurse.",
      },
      {
        input: "example.com",
        output:
          'robots.txt: absent. sitemap.xml: absent. head: title "Example Domain", no description, no OG, no twitter tags. a deliberately minimal landing page — no indexable surface beyond the home page and no social-preview metadata. a link to example.com in slack unfurls as just the URL.',
        note: "this is the baseline: it shows you what 'no SEO, no social cards' looks like. anything above this is intentional.",
      },
    ],
    gotchas: [
      {
        title: "regex head parsing misses some HTML edge cases",
        body: "this tool extracts `<title>`, `<meta>`, and OG/Twitter tags using regex against the first 64KB of the home-page body — it does NOT build a DOM. unusual but valid HTML (CDATA in `<title>`, attribute values with single-quoted contents that themselves contain double quotes, comments hiding fake `<meta>` elements, SSR'd head content injected via client-side JS) will confuse it. if the fields come back empty on a page you know has them, the real HTML parser in a browser is authoritative — this is a best-effort view.",
      },
      {
        title: "the sitemap you see may be a sitemap-index",
        body: "larger sites publish `/sitemap.xml` as a list of sub-sitemap URLs rather than a list of content URLs. this tool counts top-level `<loc>` elements unconditionally — so an index file of 50 sub-sitemaps reports `urlCount: 50`, not the sum of each sub-sitemap's URL count. to get the real number you'd have to fetch and recurse each `<loc>`. that's out of scope here.",
      },
      {
        title: "robots is only fetched at /robots.txt — no per-subpath check",
        body: 'the `robots.txt` standard says the file lives at exactly the domain root. but crawlers also respect `<meta name="robots">` tags inside specific pages, and some CDN setups serve a different robots.txt per subpath via rewrite rules. this tool only reports the root-level file. a page with `<meta name="robots" content="noindex">` will still get crawled past robots.txt; the noindex happens later.',
      },
    ],
    faq: [
      {
        q: "what's the difference between `og:*` and `twitter:*` tags?",
        a: "`og:*` (OpenGraph) is the facebook-originated standard that most platforms (linkedin, slack, discord, whatsapp) now read. `twitter:*` (Twitter Cards) is twitter-specific and predates most OG readers falling back to OG. best practice: set both. twitter will use `twitter:*` if present, otherwise fall back to `og:*`. most other platforms read only OG. to avoid drift, set `twitter:card` (for layout), `twitter:site`, and let everything else come from OG.",
      },
      {
        q: "why doesn't this tool follow `sitemap: <url>` lines inside robots.txt?",
        a: "robots.txt may include one or more `Sitemap: https://…` directives pointing at non-standard sitemap locations. this tool does not parse those — it only fetches the conventional `/sitemap.xml`. so a site that publishes its sitemap at `/sitemap_google.xml` will render as `sitemap.xml: absent` here even though search engines find it just fine via robots.txt. a future refinement could parse robots and follow sitemap lines; for now the check is fixed-path.",
      },
      {
        q: "how big is the response body I'm parsing?",
        a: "the home page body is truncated to the first 64KB before head-parsing, so if the `<head>` closes past byte 65536 the tool will silently miss it. in practice heads are almost always in the first 8-16KB. the robots.txt body is truncated to 4KB for display purposes. the sitemap body is not truncated for parsing — we need to count all `<loc>` tags.",
      },
      {
        q: "why is the whole check `error` if robots is missing, but `ok` if sitemap is missing?",
        a: "it isn't — both robots and sitemap are treated as optional. a 404 on either is fine; the check stays `ok`. the check only errors if the *home page* fetch (`GET https://<domain>/`) itself fails — DNS failure, TCP refusal, or the request body throws mid-read. in that case the other two signals are meaningless because we have no head to summarise.",
      },
      {
        q: "why doesn't the tool send my cookies or custom user-agent?",
        a: "we send a fixed `User-Agent: drwho-dossier/1.0 (+https://drwho.me)` and no cookies. sites that serve a different home page to logged-in users or that bot-detect on the UA will show you the anonymous-crawler view, which is also what search engines and social-preview bots see. so this view is what the public web sees, which is usually what you want for an SEO dossier.",
      },
    ],
    related: ["dossier-dns", "dossier-headers", "dossier-redirects"],
    references: [
      { title: "robotstxt.org — the Robots Exclusion Protocol", url: "https://www.robotstxt.org/" },
      { title: "ogp.me — The Open Graph protocol", url: "https://ogp.me/" },
    ],
  },
};

export function findToolContent(slug: string): ToolContent | undefined {
  return toolContent[slug];
}
