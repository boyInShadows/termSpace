import { describe, expect, it, vi } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
  it("reuses a formatter for the same resolved locale and options", () => {
    const NumberFormat = Intl.NumberFormat;
    const construct = vi.spyOn(Intl, "NumberFormat").mockImplementation(function (locale, options) {
      return new NumberFormat(locale, options);
    });
    try {
      expect(formatNumber(12, "en", { minimumIntegerDigits: 9 })).toBe("000,000,012");
      expect(formatNumber(34, "fa", { context: "data", minimumIntegerDigits: 9 })).toBe("000,000,034");
      expect(construct).toHaveBeenCalledTimes(1);
      expect(formatNumber(56, "fa", { minimumIntegerDigits: 9 })).toBe(new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 9 }).format(56));
    } finally { construct.mockRestore(); }
  });

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

  it("keeps rating precision and compact overrides separate from default counts", () => {
    expect(formatNumber(1, "en", { minimumFractionDigits: 1, maximumFractionDigits: 1 })).toBe("1.0");
    expect(formatNumber(1, "en")).toBe("1");
    expect(formatNumber(1200, "en", { compact: true, notation: "standard" })).toBe("1,200");
    expect(formatNumber(1200, "en", { compact: true })).toBe("1.2K");
  });
});
