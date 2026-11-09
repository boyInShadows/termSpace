export const MARKETPLACE_PLATFORM_KEYS = [
  "api",
  "chatgpt",
  "claude",
  "claude-code",
  "codex",
  "cursor",
  "gemini",
  "gemini-cli",
  "vscode",
  "aider",
  "amp",
  "cline",
  "github-copilot",
  "opencode",
  "windsurf",
  "zed",
] as const;

type MarketplacePlatformKey = typeof MARKETPLACE_PLATFORM_KEYS[number];

export const MARKETPLACE_PLATFORM_REGISTRY: Record<MarketplacePlatformKey, { nameEn: string; nameFa: string }> = {
  api: { nameEn: "API", nameFa: "رابط برنامه‌نویسی" },
  chatgpt: { nameEn: "ChatGPT", nameFa: "چت‌جی‌پی‌تی" },
  claude: { nameEn: "Claude", nameFa: "کلود" },
  "claude-code": { nameEn: "Claude Code", nameFa: "کلود کد" },
  codex: { nameEn: "Codex", nameFa: "کودکس" },
  cursor: { nameEn: "Cursor", nameFa: "کرسر" },
  gemini: { nameEn: "Gemini", nameFa: "جمینای" },
  "gemini-cli": { nameEn: "Gemini CLI", nameFa: "رابط خط فرمان جمینای" },
  vscode: { nameEn: "VS Code", nameFa: "ویژوال استودیو کد" },
  aider: { nameEn: "Aider", nameFa: "ایدر" },
  amp: { nameEn: "Amp", nameFa: "آمپ" },
  cline: { nameEn: "Cline", nameFa: "کلاین" },
  "github-copilot": { nameEn: "GitHub Copilot", nameFa: "گیت‌هاب کوپایلت" },
  opencode: { nameEn: "OpenCode", nameFa: "اوپن‌کد" },
  windsurf: { nameEn: "Windsurf", nameFa: "ویندسرف" },
  zed: { nameEn: "Zed", nameFa: "زد" },
};

const PLATFORM_ALIASES = new Map<string, MarketplacePlatformKey>([
  ["api", "api"],
  ["chatgpt", "chatgpt"],
  ["claude", "claude"],
  ["claude-code", "claude-code"],
  ["claude_code", "claude-code"],
  ["claudecode", "claude-code"],
  ["codex", "codex"],
  ["cursor", "cursor"],
  ["gemini", "gemini"],
  ["gemini-cli", "gemini-cli"],
  ["gemini_cli", "gemini-cli"],
  ["geminicli", "gemini-cli"],
  ["vs-code", "vscode"],
  ["vs_code", "vscode"],
  ["vscode", "vscode"],
  ["aider", "aider"],
  ["amp", "amp"],
  ["cline", "cline"],
  ["github-copilot", "github-copilot"],
  ["github_copilot", "github-copilot"],
  ["githubcopilot", "github-copilot"],
  ["copilot", "github-copilot"],
  ["opencode", "opencode"],
  ["open-code", "opencode"],
  ["windsurf", "windsurf"],
  ["zed", "zed"],
]);

export function marketplacePlatformKey(value: string): MarketplacePlatformKey | null {
  return PLATFORM_ALIASES.get(value.trim().toLowerCase().replace(/\s+/g, "-")) ?? null;
}
