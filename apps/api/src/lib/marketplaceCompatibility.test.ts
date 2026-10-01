import { expect, it } from "vitest";
import { modelSchema, platformSchema } from "./marketplaceCompatibility.js";
import { marketplaceProductQuerySchema } from "../validation/schemas.js";

it("normalizes supported aliases while preserving distinct platforms and rejecting unrecognized claims", () => {
  expect(platformSchema.parse(" VS Code ")).toBe("vscode");
  expect(platformSchema.parse("Claude Code")).toBe("claude-code");
  expect(platformSchema.parse("Claude")).toBe("claude");
  expect(modelSchema.parse("Model agnostic")).toBe("model-agnostic");
  expect(
    marketplaceProductQuerySchema.parse({
      community: "codex",
      platform: "Codex",
      model: "GPT-5",
    }),
  ).toMatchObject({ community: "codex", platform: "codex", model: "gpt-5" });
  expect(platformSchema.safeParse("invented-platform").success).toBe(false);
  expect(modelSchema.safeParse("invented-model").success).toBe(false);
});
