import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
  it("uses Persian digits in Persian prose", () => {
    expect(formatNumber(1234, "fa")).toBe("۱٬۲۳۴");
  });

  it("keeps Latin digits for data in every locale", () => {
    expect(formatNumber(1234, "fa", { context: "data" })).toBe("1,234");
    expect(formatNumber(1234, "en", { context: "data" })).toBe("1,234");
  });

  it("compacts large counts in the reader's language", () => {
    expect(formatNumber(9400, "en", { compact: true })).toBe("9.4K");
    expect(formatNumber(9400, "fa", { compact: true })).toMatch(/^۹٫۴/);
  });
});
