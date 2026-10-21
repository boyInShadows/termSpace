import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { comparePassword } from "./passwordCompare.js";

describe("comparePassword", () => {
  it("accepts the right password and rejects a wrong one", async () => {
    const stored = await hash("correct horse battery", 4);
    expect(await comparePassword("correct horse battery", stored)).toBe(true);
    expect(await comparePassword("wrong", stored)).toBe(false);
  });

  it.each([undefined, null, ""])("rejects when there is no stored hash (%j), after doing the work", async (missing) => {
    const started = performance.now();
    expect(await comparePassword("anything", missing)).toBe(false);
    // A cost-12 bcrypt compare takes well over 20 ms; an early return would not.
    expect(performance.now() - started).toBeGreaterThan(20);
  });
});
