# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

Last checked against repository code on 2026-10-02. See
[`docs/pending-audit-2026-10-01.md`](docs/pending-audit-2026-10-01.md) for existing
foundations and the former scope of every item. The checklist series was
verified in an isolated database; deployed publication remains unverified.
The Discovery and Community batch is complete; see
[`docs/marketplace-discovery-and-trust.md`](docs/marketplace-discovery-and-trust.md).
The Ratings and Reviews batch is complete; see `changelog.md`.
The Operations and Growth batch is complete; see
[`docs/marketplace-operations.md`](docs/marketplace-operations.md).
The Blog editorial batch is complete in the codebase; see
[`docs/blog-editorial-workflows.md`](docs/blog-editorial-workflows.md).

## Deployment follow-up

- Run the idempotent seed in the deployed environment and verify the three
  checklist articles and living dossier are public. Source and isolated database
  tests cannot confirm publication in the deployed editorial database.
- Configure Cloudflare Email Service and start the optional email worker in the
  deployed environment before sending newsletter campaigns.

## Creator publishing

- Connect the creator dashboard to the existing listing lifecycle endpoint for
  submission and other permitted creator transitions. Draft saving and source
  verification currently have UI callers, but submission does not. See
  `docs/api-cleanup-2026-10-02.md` for the route and caller audit.
