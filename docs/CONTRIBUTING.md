# Contributing to TermSpace

## Before opening a pull request

Run the checks that apply to your change from the repository root:

```bash
npm run typecheck
npm test
npm run build
```

For database or container changes, also validate the relevant migration and Compose configuration locally.

## Pull-request checklist

- Keep the change focused and explain the user-facing or operational impact.
- Include tests for behavior changes.
- Do not commit secrets, local environment files, uploaded media, or database dumps.
- Document required environment-variable or migration changes.
- Call out deployment and rollback considerations for production-impacting changes.
- Keep Persian/RTL behavior in mind when changing shared UI components.

## Review and merge

Use a descriptive title and summarize verification in the pull-request body. Address review comments before merging, and prefer small, independently deployable changes.
