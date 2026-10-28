import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("dashboard layout", () => {
  it("keeps every dashboard route out of search indexes", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
