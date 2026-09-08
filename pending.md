# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Product Features

- Add immersive article formats such as visual timelines, annotated case studies, interviews, data stories, and side-by-side arguments.
- Add living topic dossiers that collect key ideas, timelines, people, resources, and new coverage around an evolving subject.
- Add a concise editorial Signals format for notable product changes, statistics, patterns, quotations, and tools between major articles.
- Add curated reader perspectives with focused prompts and editor-selected responses presented as article margin notes.
- Add newsletter subscriber export, unsubscribe links, campaign creation, article-to-email publishing, and delivery analytics.
- Add threaded replies to comments, including moderation and clear parent-comment context.

## Bug Audit — 2026-08-27

### Lower Priority


## Bug Audit — 2026-09-02

### Lower Priority

- Copy each app's `next.config` into the runtime container image, or move the settings elsewhere, so `images.remotePatterns` and `reactStrictMode` apply at runtime rather than only at build time.
- Pin the `apps/web` dependencies currently declared as `latest` so installs are reproducible without relying solely on `package-lock.json`.
