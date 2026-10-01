import { z } from "zod";

export const marketplacePlatforms = [
  { key: "claude", name: "Claude" },
  { key: "chatgpt", name: "ChatGPT" },
  { key: "claude-code", name: "Claude Code" },
  { key: "gemini-cli", name: "Gemini CLI" },
  { key: "codex", name: "Codex" },
  { key: "cursor", name: "Cursor" },
  { key: "vscode", name: "VS Code" },
  { key: "gemini", name: "Gemini" },
  { key: "api", name: "API" },
] as const;
export const marketplaceModels = [
  { key: "gpt-5", name: "GPT-5" },
  { key: "claude-4", name: "Claude 4" },
  { key: "gemini-2.5", name: "Gemini 2.5" },
  { key: "model-agnostic", name: "Model agnostic" },
] as const;

function canonical(
  value: unknown,
  entries: ReadonlyArray<{ key: string; name: string }>,
) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase().replace(/[ _]+/g, "-");
  return (
    entries.find((entry) =>
      [entry.key, entry.name.toLowerCase().replace(/[ _]+/g, "-")].includes(
        normalized,
      ),
    )?.key ?? normalized
  );
}
export const platformSchema = z.preprocess(
  (value) => canonical(value, marketplacePlatforms),
  z.enum([
    "claude",
    "claude-code",
    "chatgpt",
    "codex",
    "cursor",
    "vscode",
    "gemini",
    "gemini-cli",
    "api",
  ]),
);
export const modelSchema = z.preprocess(
  (value) => canonical(value, marketplaceModels),
  z.enum(["gpt-5", "claude-4", "gemini-2.5", "model-agnostic"]),
);
