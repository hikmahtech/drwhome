import { sendMcpEvent } from "@/lib/analytics/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("sendMcpEvent", () => {
  it("POSTs an mcp_tool_call event to the Measurement Protocol endpoint", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST12345";
    process.env.GA_API_SECRET = "secret-xyz";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 200 }));

    await sendMcpEvent({ name: "base64_encode", success: true });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-TEST12345&api_secret=secret-xyz",
    );
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(typeof body.client_id).toBe("string");
    expect(body.events).toEqual([
      {
        name: "mcp_tool_call",
        params: {
          tool_name: "base64_encode",
          success: true,
          client_type: "mcp",
        },
      },
    ]);
  });

  it("forwards success=false", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST12345";
    process.env.GA_API_SECRET = "secret-xyz";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 200 }));

    await sendMcpEvent({ name: "jwt_decode", success: false });

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.events[0].params.success).toBe(false);
    expect(body.events[0].params.tool_name).toBe("jwt_decode");
  });

  it("no-ops when NEXT_PUBLIC_GA_MEASUREMENT_ID is missing", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = undefined;
    process.env.GA_API_SECRET = "secret-xyz";
    const fetchSpy = vi.spyOn(global, "fetch");

    await sendMcpEvent({ name: "base64_encode", success: true });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("no-ops when GA_API_SECRET is missing", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST12345";
    process.env.GA_API_SECRET = undefined;
    const fetchSpy = vi.spyOn(global, "fetch");

    await sendMcpEvent({ name: "base64_encode", success: true });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("swallows fetch errors", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST12345";
    process.env.GA_API_SECRET = "secret-xyz";
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));

    await expect(sendMcpEvent({ name: "base64_encode", success: true })).resolves.toBeUndefined();
  });
});
