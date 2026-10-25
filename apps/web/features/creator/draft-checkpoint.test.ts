import { describe, expect, it } from "vitest";
import { parseDraftCheckpoint } from "./draft-checkpoint";

const checkpoint = { version: null, step: 1, type: "skill", sourceKind: "github_repository", customLicense: false, fields: [["slug", "unfinished"]] };

describe("browser draft checkpoints", () => {
  it("accepts partial fields without treating them as a valid account draft", () => {
    expect(parseDraftCheckpoint(JSON.stringify(checkpoint))).toEqual(checkpoint);
  });

  it.each([
    "null", "{", JSON.stringify({ ...checkpoint, step: 9 }),
    JSON.stringify({ ...checkpoint, version: -1 }),
    JSON.stringify({ ...checkpoint, type: "unknown" }),
    JSON.stringify({ ...checkpoint, fields: [["slug", {}]] }),
    JSON.stringify({ ...checkpoint, fields: [["compatibility", '[["codex"]]']] }),
    JSON.stringify({ ...checkpoint, fields: [["permissions", "null"]] }),
  ])("rejects malformed stored data: %s", (raw) => {
    expect(() => parseDraftCheckpoint(raw)).toThrow();
  });
});
