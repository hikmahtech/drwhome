import { parseFrontmatter, readingTime } from "@/lib/blog";
import { describe, expect, it } from "vitest";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter into a typed object", () => {
    const raw = {
      title: "UUIDv4 vs UUIDv7",
      date: "2026-04-18",
      description: "When to pick which UUID version.",
      tags: ["uuid", "postgres"],
      relatedTool: "uuid",
    };
    const r = parseFrontmatter("uuidv4-vs-uuidv7", raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.post.slug).toBe("uuidv4-vs-uuidv7");
      expect(r.post.title).toBe("UUIDv4 vs UUIDv7");
      expect(r.post.date).toBe("2026-04-18");
      expect(r.post.relatedTool).toBe("uuid");
      expect(r.post.tags).toEqual(["uuid", "postgres"]);
    }
  });

  it("rejects a post missing a required field", () => {
    const r = parseFrontmatter("bad", { title: "x" });
    expect(r.ok).toBe(false);
  });

  it("rejects non-ISO date", () => {
    const r = parseFrontmatter("bad-date", {
      title: "x",
      date: "April 18th",
      description: "x",
    });
    expect(r.ok).toBe(false);
  });

  it("tags defaults to [] when omitted", () => {
    const r = parseFrontmatter("ok", {
      title: "x",
      date: "2026-04-18",
      description: "x",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.post.tags).toEqual([]);
  });

  it("relatedTool is optional", () => {
    const r = parseFrontmatter("ok", {
      title: "x",
      date: "2026-04-18",
      description: "x",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.post.relatedTool).toBeUndefined();
  });
});

describe("readingTime", () => {
  it("returns at least 1 minute for tiny content", () => {
    expect(readingTime("hello")).toBe(1);
  });

  it("rounds up to the nearest minute at 200 wpm", () => {
    const words = Array.from({ length: 450 }, () => "word").join(" ");
    expect(readingTime(words)).toBe(3);
  });
});
