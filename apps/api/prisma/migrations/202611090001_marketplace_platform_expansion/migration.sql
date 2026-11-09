-- Forward-only data migration: seven more agentic-coding platforms and one community each.
-- Mirrors MARKETPLACE_PLATFORM_REGISTRY in apps/api/src/lib/marketplacePlatforms.ts.
-- Idempotent: seed.ts upserts the same platform rows, so conflicts are skipped, not overwritten.

INSERT INTO "MarketplacePlatform" ("key", "nameEn", "nameFa", "position") VALUES
  ('aider', 'Aider', 'ایدر', 100),
  ('amp', 'Amp', 'آمپ', 110),
  ('cline', 'Cline', 'کلاین', 120),
  ('github-copilot', 'GitHub Copilot', 'گیت‌هاب کوپایلت', 130),
  ('opencode', 'OpenCode', 'اوپن‌کد', 140),
  ('windsurf', 'Windsurf', 'ویندسرف', 150),
  ('zed', 'Zed', 'زد', 160)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "MarketplaceCommunity" (
  "id", "slug", "nameEn", "nameFa", "descriptionEn", "primaryPlatform", "rulesEn", "submissionGuidanceEn", "updatedAt"
) VALUES
  ('community_aider', 'aider', 'Aider', 'ایدر', 'Conventions, prompts, and workflows for the Aider terminal pair-programming agent.', 'aider', 'Listings must accurately describe how they work with Aider and which models or settings they assume.', 'Explain how the item is loaded by Aider, the files it touches, and any model or configuration requirements.', now()),
  ('community_amp', 'amp', 'Amp', 'آمپ', 'Agentic coding tools, rules, and integrations for Amp.', 'amp', 'Listings must disclose permissions, commands, and external services used with Amp.', 'Describe installation, activation, and which Amp surfaces the item relies on.', now()),
  ('community_cline', 'cline', 'Cline', 'کلاین', 'MCP servers, rules, and workflows for the Cline coding agent.', 'cline', 'Listings must disclose tool access, commands, and file-system effects, and avoid unsupported compatibility claims.', 'Document installation in Cline, required settings, and the permissions the agent will be asked to approve.', now()),
  ('community_github_copilot', 'github-copilot', 'GitHub Copilot', 'گیت‌هاب کوپایلت', 'Instructions, agents, and MCP servers for GitHub Copilot in the editor, CLI, and coding agent.', 'github-copilot', 'Listings must state which Copilot surfaces are supported and disclose requested access and external services.', 'Identify the Copilot surface (editor, CLI, or coding agent), required plan or policy settings, and the install path.', now()),
  ('community_opencode', 'opencode', 'OpenCode', 'اوپن‌کد', 'Agents, plugins, and rules for the OpenCode terminal coding agent.', 'opencode', 'Listings must accurately declare installation, permissions, and supported OpenCode behavior.', 'Explain where the item is installed in OpenCode and which commands or models it expects.', now()),
  ('community_windsurf', 'windsurf', 'Windsurf', 'ویندسرف', 'Rules, workflows, and MCP servers for the Windsurf editor and its agent.', 'windsurf', 'Listings must identify supported Windsurf features and disclose requested access.', 'Describe installation, project scope, and any required Windsurf settings.', now()),
  ('community_zed', 'zed', 'Zed', 'زد', 'Agent extensions, rules, and MCP servers for the Zed editor.', 'zed', 'Listings must distinguish editor extensions from external services and disclose requested access.', 'Identify the extension or server boundary, required accounts, and the Zed version you tested.', now())
ON CONFLICT ("slug") DO NOTHING;
