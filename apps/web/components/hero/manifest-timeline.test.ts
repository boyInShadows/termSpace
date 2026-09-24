import { describe, expect, it } from "vitest";
import { COMMANDS, DONE_AT, DONE_FRAME, MANIFEST_ROWS, frameAt, frameKey } from "./manifest-timeline";

describe("manifest timeline", () => {
  it("starts as an empty prompt with the caret on the first line", () => {
    const frame = frameAt(0);
    expect(frame.phase).toBe("idle");
    expect(frame.typed).toEqual({ search: 0, inspect: 0, add: 0 });
    expect(frame.caret).toBe("search");
    expect(frame.rows).toBe(0);
    expect(frame.chips).toEqual({ network: false, verified: false, version: false });
  });

  it("walks the phases in storyboard order", () => {
    const phases = [0, 1000, 2500, 4000, 5500, DONE_AT].map((t) => frameAt(t).phase);
    expect(phases).toEqual(["idle", "typing", "resolving", "unfolding", "installing", "done"]);
  });

  it("finishes typing the search before its result appears", () => {
    const beforeResult = frameAt(2199);
    expect(beforeResult.typed.search).toBe(COMMANDS.search.length);
    expect(beforeResult.result).toBe(false);
    expect(frameAt(2200).result).toBe(true);
  });

  it("unfolds the manifest one row at a time", () => {
    const counts = [3799, 3800, 3920, 4040, 4160, 4280, 9000].map((t) => frameAt(t).rows);
    expect(counts).toEqual([0, 1, 2, 3, 4, 5, MANIFEST_ROWS.length]);
  });

  it("lands each chip with the line that justifies it", () => {
    const permissionsLanded = frameAt(4280);
    expect(permissionsLanded.chips.network).toBe(true);
    expect(permissionsLanded.chips.verified).toBe(false);
    expect(frameAt(4520).chips.verified).toBe(true);
    expect(frameAt(6249).chips.version).toBe(false);
    expect(frameAt(6250).chips.version).toBe(true);
  });

  it("holds a complete final frame with no caret", () => {
    expect(DONE_FRAME).toEqual(frameAt(60_000));
    expect(DONE_FRAME.typed).toEqual({
      search: COMMANDS.search.length,
      inspect: COMMANDS.inspect.length,
      add: COMMANDS.add.length,
    });
    expect(DONE_FRAME.caret).toBeNull();
    expect(DONE_FRAME.installed).toBe(true);
    expect(DONE_FRAME.chips).toEqual({ network: true, verified: true, version: true });
  });

  it("gives equal frames equal keys and changed frames different ones", () => {
    expect(frameKey(frameAt(100))).toBe(frameKey(frameAt(200)));
    expect(frameKey(frameAt(100))).not.toBe(frameKey(frameAt(700)));
  });
});
