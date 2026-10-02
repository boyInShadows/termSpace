import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders safe links and removes executable link targets", () => {
    expect(renderMarkdown("[Guide](https://example.com/guide)")).toContain('href="https://example.com/guide"');
    expect(renderMarkdown("[Unsafe](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("escapes attribute-breaking characters", () => {
    expect(renderMarkdown('[Link](https://example.com/\" onmouseover=\"alert(1))')).not.toContain('onmouseover="');
  });

  it("does not treat protocol-relative links as internal paths", () => {
    expect(renderMarkdown("[Unsafe](//example.com/path)")).not.toContain("href=");
    expect(renderMarkdown("[Unsafe](/\\example.com/path)")).not.toContain("href=");
    expect(renderMarkdown("[Internal](/blog/article)")).toContain('href="/blog/article"');
  });

  it("renders each editorial block without executing untrusted markup", () => {
    const html = renderMarkdown(":::timeline\nNow | <img src=x onerror=alert(1)>\n:::\n:::annotations\nClaim | Note\n:::\n:::interview\nEditor | Answer\n:::\n:::data\nMetric | 42\n:::\n:::compare\nFor | Against\n:::");
    for (const className of ["editorial-timeline", "editorial-annotations", "editorial-interview", "editorial-data", "editorial-compare"]) expect(html).toContain(className);
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
  });
});
