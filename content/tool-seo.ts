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
};

export function findToolContent(slug: string): ToolContent | undefined {
  return toolContent[slug];
}
