import { describe, expect, it } from "vitest";
import { pageAlternates } from "./alternates";

describe("pageAlternates", () => {
  it("canonicalises each locale to itself", () => {
    expect(pageAlternates("/explore", "en").canonical).toBe("/explore");
    expect(pageAlternates("/explore", "fa").canonical).toBe("/fa/explore");
  });

  it("maps the home page to /fa, not /fa/", () => {
    expect(pageAlternates("/", "fa")).toEqual({
      canonical: "/fa",
      languages: { en: "/", fa: "/fa", "x-default": "/" },
    });
  });
});
