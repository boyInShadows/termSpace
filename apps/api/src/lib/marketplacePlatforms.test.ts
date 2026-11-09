import { describe, expect, it } from "vitest";
import { MARKETPLACE_PLATFORM_KEYS, MARKETPLACE_PLATFORM_REGISTRY, marketplacePlatformKey } from "./marketplacePlatforms.js";

describe("marketplace platform registry", () => {
  it("has a name for every key, and keys are unique slugs", () => {
    expect(new Set(MARKETPLACE_PLATFORM_KEYS).size).toBe(MARKETPLACE_PLATFORM_KEYS.length);
    for (const key of MARKETPLACE_PLATFORM_KEYS) {
      expect(key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(MARKETPLACE_PLATFORM_REGISTRY[key].nameEn).toBeTruthy();
      expect(MARKETPLACE_PLATFORM_REGISTRY[key].nameFa).toBeTruthy();
    }
  });

  it("resolves canonical keys and common spellings of the newer platforms", () => {
    for (const key of MARKETPLACE_PLATFORM_KEYS) expect(marketplacePlatformKey(key)).toBe(key);
    expect(marketplacePlatformKey("Copilot")).toBe("github-copilot");
    expect(marketplacePlatformKey("GitHub Copilot")).toBe("github-copilot");
    expect(marketplacePlatformKey("Open Code")).toBe("opencode");
    expect(marketplacePlatformKey("VS Code")).toBe("vscode");
    expect(marketplacePlatformKey("not-a-platform")).toBeNull();
  });
});
