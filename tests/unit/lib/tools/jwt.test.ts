import { decodeJwt } from "@/lib/tools/jwt";
import { describe, expect, it } from "vitest";

const VALID =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes a valid JWT", () => {
    const r = decodeJwt(VALID);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(r.payload).toEqual({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
      expect(r.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    }
  });
  it("errors on wrong segment count", () => {
    expect(decodeJwt("a.b").ok).toBe(false);
    expect(decodeJwt("just-one-segment").ok).toBe(false);
  });
  it("errors on non-JSON payload", () => {
    expect(decodeJwt("Zm9v.YmFy.sig").ok).toBe(false);
  });
  it("handles empty input", () => {
    expect(decodeJwt("").ok).toBe(false);
  });
});
