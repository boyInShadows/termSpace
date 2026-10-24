import { describe, expect, it } from "vitest";
import { legalDocs, type LegalSlug } from "./legal";

describe("legal documents", () => {
  const slugs = Object.keys(legalDocs.en) as LegalSlug[];

  it.each(slugs)("%s has the same structure in English and Persian", (slug) => {
    const shape = (doc: (typeof legalDocs)["en"][LegalSlug]) => doc.sections.map((s) => [s.body?.length ?? 0, s.list?.length ?? 0]);
    expect(shape(legalDocs.fa[slug])).toEqual(shape(legalDocs.en[slug]));
    expect(legalDocs.fa[slug].title).not.toBe(legalDocs.en[slug].title);
  });

  it("has no placeholder text left in any document", () => {
    expect(JSON.stringify(legalDocs)).not.toMatch(/lorem|TODO|TBD|example\.com/i);
  });
});
