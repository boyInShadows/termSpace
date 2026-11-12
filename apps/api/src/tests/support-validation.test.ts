import { describe, expect, it } from "vitest";
import { supportCreateSchema, supportReplySchema, supportListSchema } from "../validation/schemas.js";

describe("support request boundaries", () => {
  it("trims new content and preserves line breaks inside messages", () => {
    expect(supportCreateSchema.parse({ category: "GENERAL", subject: " A ", message: " one\ntwo " }))
      .toEqual({ category: "GENERAL", subject: "A", message: "one\ntwo" });
  });
  it("rejects blank, oversized, privileged and unsupported inputs", () => {
    const valid = { category: "GENERAL", subject: "A", message: "B" };
    for (const change of [{ subject: " " }, { subject: "a".repeat(121) }, { message: "a".repeat(5001) }, { ownerId: "other" }, { status: "RESOLVED" }, { attachments: [] }]) {
      expect(supportCreateSchema.safeParse({ ...valid, ...change }).success).toBe(false);
    }
    expect(supportReplySchema.safeParse({ message: "B", version: -1 }).success).toBe(false);
    expect(supportReplySchema.safeParse({ message: "B", version: 0, authorRole: "ADMINISTRATOR" }).success).toBe(false);
  });
  it("bounds URL filters and pagination", () => {
    expect(supportListSchema.parse({ page: "2", q: " test " })).toEqual({ page: 2, q: "test" });
    for (const query of [{ page: "0" }, { page: "10001" }, { category: "SECRET" }, { ownerId: "other" }, { q: ["x", "y"] }]) {
      expect(supportListSchema.safeParse(query).success).toBe(false);
    }
  });
});
