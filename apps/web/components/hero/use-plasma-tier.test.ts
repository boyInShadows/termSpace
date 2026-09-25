import { describe, expect, it } from "vitest";
import { plasmaTierFor } from "./use-plasma-tier";

const desktop = {
  reducedMotion: false,
  saveData: false,
  reducedData: false,
  width: 1440,
  coarsePointer: false,
  cores: 8,
  memoryGb: 8,
};

describe("plasmaTierFor", () => {
  it("gives a capable desktop the WebGL field", () => {
    expect(plasmaTierFor(desktop)).toBe("webgl");
  });

  it("holds everything still for reduced motion, Save-Data and reduced data", () => {
    expect(plasmaTierFor({ ...desktop, reducedMotion: true })).toBe("static");
    expect(plasmaTierFor({ ...desktop, saveData: true })).toBe("static");
    expect(plasmaTierFor({ ...desktop, reducedData: true })).toBe("static");
  });

  it("sends phones, touch screens and low-end machines to the CSS tier", () => {
    expect(plasmaTierFor({ ...desktop, width: 1023 })).toBe("css");
    expect(plasmaTierFor({ ...desktop, coarsePointer: true })).toBe("css");
    expect(plasmaTierFor({ ...desktop, cores: 2 })).toBe("css");
    expect(plasmaTierFor({ ...desktop, memoryGb: 2 })).toBe("css");
  });

  it("does not penalise browsers that hide cores or memory", () => {
    expect(plasmaTierFor({ ...desktop, cores: undefined, memoryGb: undefined })).toBe("webgl");
  });

  it("prefers static over css when both apply", () => {
    expect(plasmaTierFor({ ...desktop, width: 375, coarsePointer: true, saveData: true })).toBe("static");
  });
});
