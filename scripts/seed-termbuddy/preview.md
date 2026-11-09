# TermBuddy seed preview (34 listings)

## GitHub MCP Server  `mcp_server` · development
*Let your coding agent read repositories, manage issues and pull requests, and inspect Actions runs on GitHub.*

GitHub's official Model Context Protocol server. It connects an MCP-capable coding agent to GitHub so the agent can browse and search repositories and code, read commits, create and update issues and pull requests, check GitHub Actions workflow runs and review security findings such as Dependabot alerts.

It runs either as GitHub's hosted remote server (authenticated with OAuth or a personal access token) or as a local server you run yourself from the published binary or container image. Tools are grouped into toolsets (the defaults are context, repos, issues, pull_requests and users), and you can enable only the toolsets you need to keep the agent's tool list small.

Listed by TermBuddy as a third-party project. Maintained by GitHub; this listing is not endorsed by GitHub.

- slug: `github-mcp-server` · version 2.1.0 · licence MIT
- author: GitHub · source: https://github.com/github/github-mcp-server
- platforms: claude-code, claude, codex, cursor, vscode, gemini-cli, github-copilot, opencode, windsurf, zed
- permissions: network_access, external_account_access, secret_access
- tags: mcp, github, pull-requests, issues, github-actions, code-review · communities: claude-code, codex, cursor, vscode, gemini-cli, github-copilot, opencode, windsurf, zed
- checked: https://github.com/github/github-mcp-server https://github.com/github/github-mcp-server/releases/tag/v2.1.0

---

## Playwright MCP  `mcp_server` · development
*Give your coding agent a real browser to navigate, click, fill forms and inspect pages through structured snapshots.*

Microsoft's Playwright MCP server lets an MCP-capable coding agent drive a browser using Playwright. Instead of screenshots it works from the page's accessibility tree, so actions are deterministic and need no vision model. Typical uses are exploratory testing, reproducing a bug in a running web app, filling forms and checking what a page actually renders.

Upstream notes that for coding agents a CLI-plus-skills workflow can be more token-efficient than MCP, while MCP stays useful for loops that need persistent browser state and rich introspection.

Listed by TermBuddy as a third-party project. Maintained by Microsoft; this listing is not endorsed by Microsoft.

- slug: `playwright-mcp` · version 0.0.84 · licence Apache-2.0
- author: Microsoft · source: https://github.com/microsoft/playwright-mcp
- platforms: claude-code, claude, cursor, vscode, amp, cline, github-copilot, opencode, windsurf
- permissions: browser_automation, process_execution, network_access
- tags: mcp, browser-automation, playwright, testing, web · communities: claude-code, cursor, vscode, amp, cline, github-copilot, opencode, windsurf
- checked: https://github.com/microsoft/playwright-mcp https://www.npmjs.com/package/@playwright/mcp

---

## Context7  `mcp_server` · development
*Pull current, version-specific library documentation and code examples into your coding agent's prompt.*

Context7 by Upstash fetches up-to-date documentation and code examples for the libraries you use and hands them to your coding agent, so answers are not based on stale training data or invented APIs. Add "use context7" to a prompt, or let the agent call the tools itself.

It runs as a hosted MCP server at mcp.context7.com, or locally through the published npm package. An API key from context7.com is passed in an Authorization header; see the upstream docs for current limits and plans.

Listed by TermBuddy as a third-party project. Maintained by Upstash; this listing is not endorsed by Upstash.

- slug: `context7-mcp` · version 4.5.1 · licence MIT
- author: Upstash · source: https://github.com/upstash/context7
- platforms: claude-code, claude, cursor, chatgpt, opencode
- permissions: network_access, secret_access
- tags: mcp, documentation, libraries, context, docs · communities: claude-code, cursor, codex, opencode
- checked: https://github.com/upstash/context7 https://www.npmjs.com/package/@upstash/context7-mcp

---

## Chrome DevTools MCP  `mcp_server` · development
*Let your coding agent control and inspect a live Chrome browser: debugging, network, console and performance traces.*

Chrome DevTools for agents (chrome-devtools-mcp) gives an AI coding assistant access to Chrome DevTools. The agent can record performance traces and extract insights, analyze network requests, read console messages with source-mapped stack traces, take screenshots and automate actions in the browser. It is available as an MCP server and as a CLI.

Upstream warns that it exposes the content of the browser instance to the MCP client, so avoid sharing sensitive information in the controlled browser. Usage statistics are collected by default; they can be disabled with the --no-usage-statistics flag.

Listed by TermBuddy as a third-party project. Maintained by Chrome DevTools team (Google); this listing is not endorsed by Chrome DevTools team (Google).

- slug: `chrome-devtools-mcp` · version 1.12.0 · licence Apache-2.0
- author: Chrome DevTools team (Google) · source: https://github.com/ChromeDevTools/chrome-devtools-mcp
- platforms: claude-code, claude, cursor, vscode, github-copilot
- permissions: browser_automation, process_execution, network_access, telemetry
- tags: mcp, chrome, devtools, debugging, performance · communities: claude-code, cursor, vscode, github-copilot
- checked: https://github.com/ChromeDevTools/chrome-devtools-mcp https://www.npmjs.com/package/chrome-devtools-mcp

---

## Supabase MCP Server  `mcp_server` · development
*Connect your Supabase projects to your coding agent to manage tables, query data and read docs.*

Supabase's MCP server connects AI assistants to your Supabase projects so they can perform tasks such as managing tables and fetching data. It is hosted at mcp.supabase.com and asks you to log in to Supabase and choose an organization when you set it up.

The server URL accepts options such as project_ref (limit it to one project), read_only=true and features=database,docs to narrow what the agent can do. Upstream recommends reading its security best practices first, because connecting an LLM to a database carries real risk; prefer a development project and read-only mode.

Listed by TermBuddy as a third-party project. Maintained by Supabase; this listing is not endorsed by Supabase.

- slug: `supabase-mcp` · version 0.16.1 · licence Apache-2.0
- author: Supabase · source: https://github.com/supabase-community/supabase-mcp
- platforms: claude-code, claude, cursor, vscode, windsurf
- permissions: network_access, external_account_access
- tags: mcp, supabase, database, postgres, backend · communities: claude-code, cursor, vscode, windsurf
- checked: https://github.com/supabase-community/supabase-mcp https://supabase.com/mcp

---

## Firecrawl MCP Server  `mcp_server` · research
*Search, scrape, crawl and map the live web from your agent and get back clean Markdown or structured data.*

Firecrawl's official MCP server brings Firecrawl to MCP-compatible clients. The agent can search the web (optionally with full page content), scrape a URL into Markdown or structured JSON, parse PDFs and documents, crawl or map a site, interact with dynamic pages in a real browser, and run multi-source research jobs. It also exposes credit-usage checks, and supports cloud and self-hosted Firecrawl with automatic retries and rate limiting.

A Firecrawl API key is required for the cloud service.

Listed by TermBuddy as a third-party project. Maintained by Firecrawl; this listing is not endorsed by Firecrawl.

- slug: `firecrawl-mcp-server` · version 3.38.0 · licence MIT
- author: Firecrawl · source: https://github.com/firecrawl/firecrawl-mcp-server
- platforms: claude-code, claude, cursor, windsurf
- permissions: network_access, secret_access, external_account_access
- tags: mcp, web-scraping, crawling, search, research · communities: claude-code, cursor, windsurf
- checked: https://github.com/firecrawl/firecrawl-mcp-server https://www.npmjs.com/package/firecrawl-mcp

---

## Tavily MCP Server  `mcp_server` · research
*Real-time web search, page extraction, site mapping and crawling for your agent through Tavily.*

Tavily's MCP server provides search, extract, map and crawl tools. The agent gets real-time web search through tavily-search, intelligent extraction of page content through tavily-extract, a structured map of a website and a crawler that explores sites systematically.

It runs locally via npx with a Tavily API key, or you can connect to Tavily's remote MCP server at mcp.tavily.com. Remote requests can carry default parameters in a DEFAULT_PARAMETERS header.

Listed by TermBuddy as a third-party project. Maintained by Tavily; this listing is not endorsed by Tavily.

- slug: `tavily-mcp` · version 0.2.22 · licence MIT
- author: Tavily · source: https://github.com/tavily-ai/tavily-mcp
- platforms: claude-code, claude, cursor
- permissions: network_access, secret_access, external_account_access
- tags: mcp, web-search, crawling, extraction, research · communities: claude-code, cursor
- checked: https://github.com/tavily-ai/tavily-mcp https://www.npmjs.com/package/tavily-mcp

---

## Claude Code GitHub Action  `integration` · development
*Run Claude Code in GitHub Actions to answer @claude mentions, review pull requests and implement changes.*

A general-purpose Claude Code action for GitHub pull requests and issues. It detects when to activate from your workflow context and can answer questions about code, review a PR, implement fixes or features and report progress with updating checklists. It runs on your own GitHub runner; Anthropic API calls go to your chosen provider (Anthropic, AWS Bedrock, Google Vertex AI or Microsoft Foundry).

The quickest setup is to open Claude Code in your repository and run /install-github-app. You must be a repository admin to install the GitHub app and add secrets.

Listed by TermBuddy as a third-party project. Maintained by Anthropic; this listing is not endorsed by Anthropic.

- slug: `claude-code-github-action` · version 1.0.269 · licence MIT
- author: Anthropic · source: https://github.com/anthropics/claude-code-action
- platforms: claude-code
- permissions: code_modification, filesystem_read, filesystem_write, network_access, external_account_access, secret_access
- tags: github-actions, ci, code-review, pull-requests, automation · communities: claude-code
- checked: https://github.com/anthropics/claude-code-action https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md

---

## Run Gemini CLI GitHub Action  `integration` · development
*Run Gemini CLI in GitHub Actions to review pull requests, triage issues and make code changes on demand.*

run-gemini-cli is a GitHub Action that brings Gemini into your development workflow through the Gemini CLI. It works as an autonomous agent for routine coding tasks and as an on-demand collaborator you can call conversationally (for example @gemini-cli fix this issue). Use it for pull request reviews, issue triage and code analysis and modification.

Authenticate with a GEMINI_API_KEY repository secret, or with Workload Identity Federation for Google Cloud when you have a GCP project. Upstream recommends pinning the action version.

Listed by TermBuddy as a third-party project. Maintained by Google; this listing is not endorsed by Google.

- slug: `run-gemini-cli-github-action` · version 0.1.22 · licence Apache-2.0
- author: Google · source: https://github.com/google-github-actions/run-gemini-cli
- platforms: gemini-cli
- permissions: code_modification, filesystem_read, network_access, external_account_access, secret_access
- tags: github-actions, gemini, code-review, issue-triage, automation · communities: gemini-cli
- checked: https://github.com/google-github-actions/run-gemini-cli https://github.com/google-gemini/gemini-cli

---

## Superpowers  `skill` · development
*A software development methodology for coding agents, delivered as composable skills that trigger automatically.*

Superpowers is a complete development methodology built from composable skills plus initial instructions that make your agent use them. When it sees you are building something it does not jump straight into code: it asks what you are really trying to do, shows a spec in chunks short enough to read, then writes an implementation plan, and runs a subagent-driven development process in which agents work through tasks while their work is inspected and reviewed.

Skills in the repository include brainstorming, test-driven-development, systematic-debugging, requesting and receiving code review, using git worktrees, dispatching parallel agents and verification-before-completion. Installation differs per agent harness; install it separately for each one you use.

Listed by TermBuddy as a third-party project. Maintained by obra (Prime Radiant); this listing is not endorsed by obra (Prime Radiant).

- slug: `superpowers` · version 7.0.2 · licence MIT
- author: obra (Prime Radiant) · source: https://github.com/obra/superpowers
- platforms: claude-code, codex, cursor, gemini-cli, github-copilot, opencode
- permissions: filesystem_read, filesystem_write, process_execution, code_modification
- tags: skills, methodology, tdd, code-review, subagents, planning · communities: claude-code, codex, cursor, gemini-cli, github-copilot, opencode
- checked: https://github.com/obra/superpowers https://github.com/obra/superpowers/releases/tag/v7.0.2

---

## Anthropic Agent Skills  `skill` · development
*Anthropic's public repository of Agent Skills, from frontend design and webapp testing to document handling.*

A public repository of Agent Skills: folders of instructions, scripts and resources that Claude loads dynamically to improve performance on specialised tasks. Each skill is self-contained in its own folder with a SKILL.md file. The collection spans creative and design skills, technical skills such as testing web apps and building MCP servers, enterprise and communication skills, and the document skills (docx, pdf, pptx, xlsx) that Anthropic describes as powering Claude's document capabilities.

Upstream states the skills are provided for demonstration and educational purposes only, and that implementations in Claude itself may differ. The repository has no single root licence: individual skills carry their own LICENSE.txt (the docx and frontend-design skills checked are Apache 2.0), so read the licence file inside a skill before reusing it. It can also be registered as a Claude Code plugin marketplace.

Listed by TermBuddy as a third-party project. Maintained by Anthropic; this listing is not endorsed by Anthropic.

- slug: `anthropic-agent-skills` · version snapshot-2026-11-06 · licence Apache-2.0 (per-skill LICENSE.txt; no root licence)
- author: Anthropic · source: https://github.com/anthropics/skills
- platforms: claude-code, claude, api
- permissions: filesystem_read, filesystem_write, process_execution
- tags: skills, agent-skills, claude, frontend-design, documents, mcp-builder · communities: claude-code
- checked: https://github.com/anthropics/skills https://github.com/anthropics/skills/blob/main/README.md

---

## Agents, Skills and Plugins Collection (wshobson)  `agent` · development
*A large catalog of plugins, subagents, skills and commands for Claude Code, Codex CLI, Cursor, OpenCode and more.*

One collection of plugins, agents, skills and commands, written once in Markdown in the Claude Code plugin format and adapted to each tool by generators with validation and evals. The upstream catalog lists 94 plugins (92 local, 2 external) containing 202 agents, 185 skills and 105 commands, covering areas such as Python and JavaScript development.

Supported harnesses named upstream are Claude Code, OpenAI Codex CLI, Cursor, OpenCode, Antigravity CLI, GitHub Copilot and Pi. Which components are available depends on the installation route and the harness's capabilities.

Listed by TermBuddy as a third-party project. Maintained by Seth Hobson (wshobson); this listing is not endorsed by Seth Hobson (wshobson).

- slug: `wshobson-agents` · version snapshot-2026-11-09 · licence MIT
- author: Seth Hobson (wshobson) · source: https://github.com/wshobson/agents
- platforms: claude-code, codex, cursor, github-copilot, opencode
- permissions: filesystem_read, filesystem_write, process_execution, code_modification
- tags: subagents, plugins, skills, claude-code, marketplace, agents · communities: claude-code, codex, cursor, github-copilot, opencode
- checked: https://github.com/wshobson/agents

---

## OpenHands Agent Canvas  `agent` · development
*A self-hosted control center for running coding agents locally, in Docker, on VMs or in the cloud.*

OpenHands Agent Canvas is a self-hosted developer control center for starting conversations and automating everyday tasks with coding agents. It runs the open source OpenHands agent out of the box and can also use third-party agents such as Claude Code, Codex, Gemini CLI, Pi and OpenCode, over local, remote and cloud backends. It runs locally by default and can connect to agent backends running in Docker containers, on VMs or in your own infrastructure.

Upstream warns that the quickstart runs the agent-server directly on your machine, giving the agent full access to your filesystem.

Listed by TermBuddy as a third-party project. Maintained by OpenHands; this listing is not endorsed by OpenHands.

- slug: `openhands-agent-canvas` · version 1.37.0 · licence MIT
- author: OpenHands · source: https://github.com/OpenHands/OpenHands
- platforms: api, claude-code, codex, gemini-cli
- permissions: filesystem_read, filesystem_write, process_execution, network_access, code_modification, background_execution
- tags: agent, self-hosted, automation, docker, openhands, control-center · communities: claude-code, codex, gemini-cli
- checked: https://github.com/OpenHands/OpenHands https://github.com/OpenHands/OpenHands/releases/tag/v1.37.0

---

## OpenCode  `agent` · development
*An open source AI coding agent for the terminal, with a desktop app and many install routes.*

OpenCode is an open source AI coding agent. It installs as a command line tool through a shell installer, npm or Homebrew, and a desktop app is available through Homebrew cask. Check the upstream README and opencode.ai for supported model providers, configuration and permissions, because those are not summarised here.

Listed by TermBuddy as a third-party project. Maintained by OpenCode (anomalyco); this listing is not endorsed by OpenCode (anomalyco).

- slug: `opencode` · version 1.19.5 · licence MIT
- author: OpenCode (anomalyco) · source: https://github.com/anomalyco/opencode
- platforms: api, opencode
- permissions: filesystem_read, filesystem_write, process_execution, network_access, code_modification
- tags: agent, terminal, cli, open-source, coding-agent · communities: opencode
- checked: https://github.com/anomalyco/opencode https://opencode.ai

---

## Spec Kit  `workflow` · development
*GitHub's toolkit for spec-driven development: a structured process your coding agent follows from spec to implementation.*

Spec Kit is an open source toolkit that gives AI coding agents structured processes, reusable templates and documented outcomes. Its main process, Spec-Driven Development, carries a specification through planning, implementation and convergence: you create a constitution of project principles once, then run specify, plan, tasks, implement and converge, repeating implement and converge until the convergence step reports Converged. Other processes cover diagnosing and repairing broken behaviour and assessing whether an idea deserves investment, and you can adopt or build your own.

Upstream documents many coding-agent integrations (43 options in total); the page names Copilot, Gemini, Codex, Claude, Kilo Code, Zed, Forge and Kiro.

Listed by TermBuddy as a third-party project. Maintained by GitHub; this listing is not endorsed by GitHub.

- slug: `github-spec-kit` · version 1.3.2 · licence MIT
- author: GitHub · source: https://github.com/github/spec-kit
- platforms: claude-code, codex, gemini-cli, vscode, github-copilot
- permissions: filesystem_write, process_execution, code_modification
- tags: spec-driven-development, planning, workflow, templates, specify, agents · communities: claude-code, codex, gemini-cli, vscode, github-copilot
- checked: https://github.com/github/spec-kit https://github.github.io/spec-kit/

---

## Awesome Cursor Rules  `rule` · development
*A community collection of Cursor Project Rules (.mdc files) for frameworks, languages and workflows.*

A curated repository of Cursor Project Rules: Markdown-based .mdc files that live in .cursor/rules/ and tell Cursor how to behave for specific projects, file types, frameworks and workflows. Add selected .mdc files to your project's .cursor/rules/ folder to use them directly. Rules can describe local architecture, preferred libraries and coding standards so suggestions fit your codebase on the first pass.

The repository is released under CC0 1.0 (public domain dedication). It names sponsors in its README; this listing does not imply any endorsement by them.

Listed by TermBuddy as a third-party project. Maintained by PatrickJS and contributors; this listing is not endorsed by PatrickJS and contributors.

- slug: `awesome-cursorrules` · version snapshot-2026-05-30 · licence CC0-1.0
- author: PatrickJS and contributors · source: https://github.com/PatrickJS/awesome-cursorrules
- platforms: cursor
- permissions: none
- tags: cursor, rules, mdc, coding-standards, prompts · communities: cursor
- checked: https://github.com/PatrickJS/awesome-cursorrules

---

## AGENTS.md  `rule` · development
*A simple, open format for guiding coding agents: a README written for agents.*

AGENTS.md is a simple, open format for guiding coding agents. Think of it as a README for agents: a dedicated, predictable place to give coding agents the context and instructions they need, such as dev environment tips, testing instructions and conventions, kept separate from the human-facing README. The agents.md site lists the tools that support it, including Codex, Cursor, Gemini CLI, VS Code, Aider, goose, opencode, Zed, Amp, Windsurf, Jules and others.

This listing covers the open format and its reference repository, not any one tool's behaviour; check your agent's documentation for how it loads the file.

Listed by TermBuddy as a third-party project. Maintained by AGENTS.md community (agentsmd); this listing is not endorsed by AGENTS.md community (agentsmd).

- slug: `agents-md` · version snapshot-2026-09-10 · licence MIT
- author: AGENTS.md community (agentsmd) · source: https://github.com/agentsmd/agents.md
- platforms: codex, cursor, gemini-cli, vscode, aider, amp, github-copilot, opencode, windsurf, zed
- permissions: none
- tags: agents-md, instructions, open-format, conventions, rules · communities: codex, cursor, gemini-cli, vscode, aider, amp, github-copilot, opencode, windsurf, zed
- checked: https://github.com/agentsmd/agents.md https://agents.md

---

## Fabric  `prompt` · development
*An open source framework and a large crowdsourced library of AI prompts (patterns) you run from the command line.*

Fabric is an open-source framework for augmenting humans using AI. It provides a modular system for solving specific problems using a crowdsourced set of AI prompts (called patterns) that can be used anywhere. The repository's data/patterns folder holds 266 patterns at the time of checking, plus a strategies folder, and the fabric command line tool runs a pattern against text you pipe in using the model provider you configure (OpenAI, Azure, Ollama and others are mentioned upstream).

First-time setup is fabric --setup, where you choose providers and enter any API keys.

Listed by TermBuddy as a third-party project. Maintained by Daniel Miessler; this listing is not endorsed by Daniel Miessler.

- slug: `fabric-patterns` · version 1.4.567 · licence MIT
- author: Daniel Miessler · source: https://github.com/danielmiessler/Fabric
- platforms: api
- permissions: network_access, secret_access
- tags: prompts, patterns, cli, fabric, llm · communities: none
- checked: https://github.com/danielmiessler/Fabric https://github.com/danielmiessler/Fabric/releases/tag/v1.4.567

---

## Claude Code Hooks Marketplace  `hook` · development
*A marketplace of 22 tested, installable hook plugins for Claude Code: safety guards, logging, formatting and notifications.*

Ready-to-use hooks for Claude Code, shipped as a 22-plugin installable marketplace covering safety, automation and notifications. Examples include block-dangerous-commands (blocks things like rm -rf ~, fork bombs, curl piped to a shell and force pushes to main), protect-secrets (stops reading, modifying or exfiltrating sensitive files), git-safety, protect-tests (blocks deleting or skip-disabling tests instead of fixing the code), format-code (runs ruff and prettier after edits), session-logger and config-watch.

Each hook is its own plugin with a script, tests and a README, grouped by the Claude Code event that fires it. Because hooks run commands on your machine, read a plugin's script before installing it.

Listed by TermBuddy as a third-party project. Maintained by karanb192; this listing is not endorsed by karanb192.

- slug: `claude-code-hooks-marketplace` · version snapshot-2026-11-02 · licence MIT
- author: karanb192 · source: https://github.com/karanb192/claude-code-hooks
- platforms: claude-code
- permissions: filesystem_read, filesystem_write, process_execution
- tags: hooks, claude-code, safety, guardrails, plugins · communities: claude-code
- checked: https://github.com/karanb192/claude-code-hooks

---

## Claude Code Templates  `template` · development
*An open registry and CLI for Claude Code components: agents, commands, skills, hooks, MCPs, settings and mods.*

An open-source catalog of components for Claude Code that installs with one command: npx claude-code-templates@latest. Components include agents, commands, skills, hooks, MCP servers, settings and mods, and a single one can be installed directly, for example with --skill or --agent. Every component page on aitmpl.com shows its exact install command.

The CLI adds files from the registry to your project, so review each component before keeping it.

Listed by TermBuddy as a third-party project. Maintained by davila7; this listing is not endorsed by davila7.

- slug: `claude-code-templates` · version 1.29.7 · licence MIT
- author: davila7 · source: https://github.com/davila7/claude-code-templates
- platforms: claude-code
- permissions: network_access, filesystem_write, process_execution
- tags: claude-code, templates, registry, cli, components · communities: claude-code
- checked: https://github.com/davila7/claude-code-templates https://aitmpl.com

---

## Claude Code Plugins Directory  `integration` · development
*Anthropic's managed directory of Claude Code plugins, with internal and third-party entries installable by name.*

A curated directory of plugins for Claude Code. The repository separates internal plugins developed and maintained by Anthropic (/plugins) from third-party plugins submitted by partners and the community (/external_plugins), which must meet quality and security standards for approval. Install a plugin with /plugin install {plugin-name}@claude-plugins-official, or browse in /plugin > Discover.

Upstream warns to trust a plugin before installing, updating or using it, because Anthropic does not control what MCP servers, files or other software a plugin includes.

Listed by TermBuddy as a third-party project. Maintained by Anthropic; this listing is not endorsed by Anthropic.

- slug: `claude-plugins-official` · version snapshot-2026-11-08 · licence Apache-2.0
- author: Anthropic · source: https://github.com/anthropics/claude-plugins-official
- platforms: claude-code
- permissions: network_access, filesystem_write, process_execution
- tags: claude-code, plugins, marketplace, directory, extensions · communities: claude-code
- checked: https://github.com/anthropics/claude-plugins-official

---

## Neon MCP Server  `mcp_server` · development
*Manage Neon Postgres projects, branches and queries from your coding agent in natural language.*

An MCP server for interacting with Neon's management API and databases. It translates natural-language requests into Neon API calls so an agent can create projects and databases, run queries, summarise projects and run schema migrations using Neon's branching. Neon documents three ways to connect: a quick setup with npx neon@latest init (which works with Cursor, VS Code and Claude Code, authenticates via OAuth and creates an API key for you), the remote server with OAuth, or the remote server with an API key.

If Neon's IP Allow is enabled, upstream says to allowlist the static IPs of mcp.neon.tech. Prefer a non-production project, because the agent can change real databases.

Listed by TermBuddy as a third-party project. Maintained by Neon; this listing is not endorsed by Neon.

- slug: `neon-mcp-server` · version snapshot-2026-11-07 · licence MIT
- author: Neon · source: https://github.com/neondatabase/mcp-server-neon
- platforms: claude-code, cursor, vscode, cline, github-copilot, windsurf, zed
- permissions: network_access, external_account_access, secret_access
- tags: mcp, neon, postgres, database, migrations · communities: claude-code, cursor, vscode, cline, github-copilot, windsurf, zed
- checked: https://github.com/neondatabase/mcp-server-neon

---

## Grafana MCP Server  `mcp_server` · operations
*Query dashboards, metrics, logs and alerts in Grafana from your coding agent.*

Grafana's MCP server connects an agent to a Grafana instance (self-hosted or Grafana Cloud). It can read dashboards and run panel queries with custom time ranges, and the upstream README documents further tool groups. Several groups are disabled by default and must be enabled with the --enabled-tools flag: panel query execution, query examples, InfluxDB, SQL (including ClickHouse, Snowflake and Athena) and CloudWatch.

Authenticate with a Grafana service account token and point GRAFANA_URL at your instance. Use a service account with only the permissions you need.

Listed by TermBuddy as a third-party project. Maintained by Grafana Labs; this listing is not endorsed by Grafana Labs.

- slug: `grafana-mcp-server` · version 2.2.0 · licence Apache-2.0
- author: Grafana Labs · source: https://github.com/grafana/mcp-grafana
- platforms: claude-code, claude, cursor, vscode
- permissions: network_access, secret_access, external_account_access
- tags: mcp, grafana, observability, dashboards, monitoring · communities: claude-code, cursor, vscode
- checked: https://github.com/grafana/mcp-grafana https://github.com/grafana/mcp-grafana/releases/tag/v2.2.0

---

## Kubernetes MCP Server  `mcp_server` · operations
*Let your agent inspect and manage a Kubernetes cluster through kubectl and Helm.*

An MCP server that connects to a Kubernetes cluster and manages it. It loads your kubeconfig (by default from ~/.kube/config; other sources are described in the upstream advanced guide) and works through kubectl, with optional Helm v3 support. It is also available as an mcpb extension for Claude Desktop.

This can change real clusters. Point it at a development context first and read the upstream documentation on available safeguards before connecting it to anything important.

Listed by TermBuddy as a third-party project. Maintained by Flux159; this listing is not endorsed by Flux159.

- slug: `kubernetes-mcp-server` · version 4.2.1 · licence MIT
- author: Flux159 · source: https://github.com/Flux159/mcp-server-kubernetes
- platforms: claude-code, claude, codex, cursor, vscode
- permissions: process_execution, filesystem_read, secret_access, external_account_access
- tags: mcp, kubernetes, kubectl, helm, devops · communities: claude-code, cursor, vscode
- checked: https://github.com/Flux159/mcp-server-kubernetes https://www.npmjs.com/package/mcp-server-kubernetes

---

## Terraform MCP Server  `mcp_server` · operations
*Give your agent Terraform Registry lookups and HCP Terraform / Terraform Enterprise workspace access.*

HashiCorp's Terraform MCP server integrates with the Terraform ecosystem for infrastructure-as-code work. It talks to the public Terraform Registry APIs for providers, modules and policies, and can work with HCP Terraform and Terraform Enterprise for workspace management, organization and project listing and private registry access. Tools are grouped into toolsets that you can select with the --toolsets and --tools flags.

HCP Terraform and Terraform Enterprise access needs a TFE_TOKEN and optionally a TFE_ADDRESS. Treat that token like any infrastructure credential and scope it narrowly. Note the licence is MPL-2.0.

Listed by TermBuddy as a third-party project. Maintained by HashiCorp; this listing is not endorsed by HashiCorp.

- slug: `terraform-mcp-server` · version 1.4.1 · licence MPL-2.0
- author: HashiCorp · source: https://github.com/hashicorp/terraform-mcp-server
- platforms: claude-code, claude, cursor, vscode, opencode
- permissions: network_access, secret_access, external_account_access, process_execution
- tags: mcp, terraform, infrastructure-as-code, hashicorp, devops · communities: claude-code, cursor, vscode, opencode
- checked: https://github.com/hashicorp/terraform-mcp-server https://github.com/hashicorp/terraform-mcp-server/releases/tag/v1.4.1

---

## Stripe MCP Server  `mcp_server` · finance
*Connect your agent to Stripe through Stripe's hosted MCP server, authenticated with OAuth.*

Stripe hosts a remote MCP server at mcp.stripe.com that gives MCP clients access to Stripe through OAuth. The stripe/ai repository is Stripe's collection for building AI-powered products and businesses: the agent toolkit packages use native MCP support with the Stripe MCP server, and the repository also contains agent skills. Stripe's documentation covers connecting a client and building autonomous agents.

This touches a payments account. Use a sandbox or test account while experimenting and check what permissions your authorization grants before connecting a live account.

Listed by TermBuddy as a third-party project. Maintained by Stripe; this listing is not endorsed by Stripe.

- slug: `stripe-mcp-server` · version snapshot-2026-11-09 · licence MIT
- author: Stripe · source: https://github.com/stripe/ai
- platforms: claude-code, claude, cursor, vscode
- permissions: network_access, external_account_access
- tags: mcp, stripe, payments, finance, billing · communities: claude-code, cursor, vscode
- checked: https://github.com/stripe/ai https://docs.stripe.com/mcp

---

## Alpaca MCP Server  `mcp_server` · finance
*Market data, analysis and (paper or live) trading with Alpaca from your agent, in plain English.*

Alpaca's official MCP server lets an LLM tool trade stocks, ETFs, crypto and options, run data analysis and build strategies against the Alpaca API. It needs Alpaca Trading API keys, and upstream recommends starting with a free paper trading account. Version 2 supports server-side tool filtering through the ALPACA_TOOLSETS environment variable; use it to withhold trading tools when you only want market data.

This can place real orders if you use live keys. Use paper keys, restrict toolsets, and never expose the server directly to the public internet with your keys (upstream warns about this for remote setups). This is not financial advice.

Listed by TermBuddy as a third-party project. Maintained by Alpaca; this listing is not endorsed by Alpaca.

- slug: `alpaca-mcp-server` · version 2.4.1 · licence MIT
- author: Alpaca · source: https://github.com/alpacahq/alpaca-mcp-server
- platforms: claude-code, claude, cursor, vscode
- permissions: network_access, secret_access, external_account_access
- tags: mcp, alpaca, trading, market-data, finance · communities: claude-code, cursor, vscode
- checked: https://github.com/alpacahq/alpaca-mcp-server https://github.com/alpacahq/alpaca-mcp-server/releases/tag/v2.4.1

---

## Atlassian MCP Server  `mcp_server` · product
*Bring Jira, Confluence, Jira Service Management, Bitbucket and Compass into your agent through Atlassian's hosted MCP server.*

The official Atlassian MCP server is a cloud-hosted bridge between your Atlassian Cloud site and compatible AI tools. Once connected, an agent can summarise and search Jira, Jira Service Management, Confluence, Bitbucket and more without you switching tools. Upstream says v2 is now the recommended version for new setups, at https://mcp.atlassian.com/v2/mcp, and that it supports OAuth 2.1 or API tokens.

See Atlassian's security and admin documentation for access requirements. The repository holds documentation for Atlassian's hosted service; the server itself is operated by Atlassian.

Listed by TermBuddy as a third-party project. Maintained by Atlassian; this listing is not endorsed by Atlassian.

- slug: `atlassian-rovo-mcp-server` · version snapshot-2026-11-07 (v2) · licence Apache-2.0
- author: Atlassian · source: https://github.com/atlassian/atlassian-mcp-server
- platforms: claude-code, claude, codex, cursor, vscode, github-copilot, windsurf
- permissions: network_access, external_account_access
- tags: mcp, atlassian, jira, confluence, product-management · communities: claude-code, cursor, vscode, github-copilot, windsurf
- checked: https://github.com/atlassian/atlassian-mcp-server

---

## Google Workspace MCP  `mcp_server` · productivity
*Gmail, Calendar, Docs, Sheets, Slides, Chat, Forms, Tasks and Drive from your agent, with your own OAuth client.*

A Google Workspace MCP server and CLI that connects AI assistants to twelve Google Workspace services, with 120+ tools behind one server. It offers OAuth 2.1 multi-user authentication, progressive tool tiers (for example core and extended) and a read-only mode. By default it sends no data anywhere except Google's APIs, on behalf of the authenticated user, using your own OAuth client credentials from your own Google Cloud project.

Setup needs an OAuth client in a Google Cloud project with the relevant APIs enabled. Start with the core tier or read-only mode, because the tools can send mail and edit documents.

Listed by TermBuddy as a third-party project. Maintained by Taylor Wilsdon; this listing is not endorsed by Taylor Wilsdon.

- slug: `google-workspace-mcp` · version 2.4.0 · licence MIT
- author: Taylor Wilsdon · source: https://github.com/taylorwilsdon/google_workspace_mcp
- platforms: claude-code, claude, cursor, vscode
- permissions: network_access, secret_access, external_account_access, persistent_storage
- tags: mcp, google-workspace, gmail, calendar, docs, productivity · communities: claude-code, cursor, vscode
- checked: https://github.com/taylorwilsdon/google_workspace_mcp https://workspacemcp.com

---

## Todoist MCP  `mcp_server` · productivity
*Let your agent manage your Todoist tasks, using Todoist's hosted MCP server or a local npx server.*

Doist's tools for connecting AI agents to Todoist on a user's behalf, including MCP support. You can use the hosted server at https://ai.todoist.net/mcp and sign in with OAuth, or run the MCP server locally with npx @doist/todoist-mcp. The same tools can also be imported into other projects as a library.

OAuth runs in your browser the first time you use a Todoist tool. The hosted route needs no API key or local server.

Listed by TermBuddy as a third-party project. Maintained by Doist; this listing is not endorsed by Doist.

- slug: `todoist-mcp` · version 13.11.2 · licence MIT
- author: Doist · source: https://github.com/Doist/todoist-mcp
- platforms: claude-code, claude, cursor, gemini-cli, vscode
- permissions: network_access, external_account_access
- tags: mcp, todoist, tasks, productivity, planning · communities: claude-code, cursor, vscode
- checked: https://github.com/Doist/todoist-mcp https://github.com/Doist/todoist-mcp/releases/tag/v13.11.2

---

## Blender MCP  `mcp_server` · creative
*Control Blender 3D from your agent: build and edit scenes, and pull in assets, through a Blender addon.*

A community plugin that lets any LLM control Blender 3D. It has two parts: a Blender addon that opens a socket server inside Blender to receive and execute commands, and an MCP server your client connects to. One command (uvx mcp-for-blender setup) finds supported MCP clients on your machine, including Claude Desktop, Claude Code, Codex, Cursor and VS Code, and installs the addon. It can bring in Poly Haven, Sketchfab and Poly Pizza assets, and the README describes AI 3D generation through providers such as Meshy, Tripo and Hyper3D Rodin.

By default the AI can run any Python code in Blender; set BLENDER_MCP_SAFE_MODE=1 to check scripts and block risky code such as direct file access. It is not affiliated with the Blender Foundation. The README also advertises a paid premium option.

Listed by TermBuddy as a third-party project. Maintained by ahujasid; this listing is not endorsed by ahujasid.

- slug: `blender-mcp` · version snapshot-2026-11-04 · licence MIT
- author: ahujasid · source: https://github.com/ahujasid/mcp-for-blender
- platforms: claude-code, claude, codex, cursor, vscode, opencode, windsurf
- permissions: process_execution, filesystem_read, filesystem_write, network_access, code_modification
- tags: mcp, blender, 3d, creative, addon · communities: claude-code, cursor, vscode, opencode, windsurf
- checked: https://github.com/ahujasid/mcp-for-blender https://www.mcp-for-blender.com/

---

## Figma Context MCP  `mcp_server` · creative
*Give AI coding agents your Figma layout information so they can build designs accurately.*

An MCP server (published as the npm package figma-developer-mcp) that provides Figma layout information to AI coding agents such as Cursor. Point an agent at a Figma file or frame and it can work from the real layout data instead of a screenshot. It is a community project by Framelink and is separate from Figma's own tools.

It needs a Figma API key, passed with the --figma-api-key option or the FIGMA_API_KEY environment variable.

Listed by TermBuddy as a third-party project. Maintained by Framelink (GLips); this listing is not endorsed by Framelink (GLips).

- slug: `figma-context-mcp` · version 0.13.2 · licence MIT
- author: Framelink (GLips) · source: https://github.com/GLips/Figma-Context-MCP
- platforms: claude-code, claude, cursor, vscode
- permissions: network_access, secret_access, external_account_access
- tags: mcp, figma, design, frontend, design-to-code · communities: claude-code, cursor, vscode
- checked: https://github.com/GLips/Figma-Context-MCP https://www.framelink.ai/ https://www.npmjs.com/package/figma-developer-mcp

---

## Google Analytics MCP Server  `mcp_server` · marketing
*Read-only access to Google Analytics reports, realtime data and property details from your agent.*

Google's Analytics MCP server lets an agent query Google Analytics. Its tools include get_account_summaries, get_property_details, list_google_ads_links, run_report, run_realtime_report and get_custom_dimensions_and_metrics. Credentials must include the Google Analytics read-only scope (analytics.readonly), and upstream describes setting up Application Default Credentials with an OAuth desktop or web client.

It is read-only by scope: it reports on your data and does not change your analytics configuration.

Listed by TermBuddy as a third-party project. Maintained by Google (Google Analytics team); this listing is not endorsed by Google (Google Analytics team).

- slug: `google-analytics-mcp` · version 1.1.0 · licence Apache-2.0
- author: Google (Google Analytics team) · source: https://github.com/googleanalytics/google-analytics-mcp
- platforms: claude-code, claude, cursor, gemini-cli, vscode
- permissions: network_access, secret_access, external_account_access
- tags: mcp, google-analytics, analytics, marketing, reporting · communities: claude-code, cursor, vscode
- checked: https://github.com/googleanalytics/google-analytics-mcp

---

## Google Ads MCP Server  `mcp_server` · marketing
*Query Google Ads accounts and (optionally) manage assets and labels from your agent, with propose-and-confirm for writes.*

Google's Ads MCP server connects an agent to Google Ads. A default tools_config.yaml with all tools enabled is bundled, and for a strictly read-only deployment you can disable the write/mutate tool categories in that configuration. The mutate tools (create_asset, upload_video_asset, manage_labels and manage_label_associations) enforce a two-step Propose and Confirm workflow. Access through a manager account needs GOOGLE_ADS_LOGIN_CUSTOMER_ID, and OAuth settings use environment variables such as GOOGLE_ADS_MCP_OAUTH_CLIENT_ID.

This is an early (0.0.x) release connected to advertising accounts with real spend. Start read-only and read the upstream documentation first.

Listed by TermBuddy as a third-party project. Maintained by Google (Google Ads API team); this listing is not endorsed by Google (Google Ads API team).

- slug: `google-ads-mcp` · version 0.0.6 · licence Apache-2.0
- author: Google (Google Ads API team) · source: https://github.com/googleads/google-ads-mcp
- platforms: claude-code, claude, cursor, gemini-cli, vscode
- permissions: network_access, secret_access, external_account_access
- tags: mcp, google-ads, advertising, marketing, campaigns · communities: claude-code, cursor, vscode
- checked: https://github.com/googleads/google-ads-mcp https://github.com/googleads/google-ads-mcp/releases/tag/v0.0.6
