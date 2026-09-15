# Creator onboarding and ownership

Creator identities are marketplace records, not Blog authors or administrator
accounts. A reader may own at most one creator profile, and a creator profile may
have at most one reader owner.

## Ownership rules

- `MarketplaceCreator.ownerUserId` is a unique foreign key to `ReaderUser`.
- A null owner identifies a system-managed legacy or seeded creator. Those
  records remain public but cannot be claimed through self-service onboarding.
- User-owned creator records use `ON DELETE RESTRICT`; deleting a reader cannot
  silently orphan listings or erase attribution.
- Ownership is never accepted from request input. Profile reads and updates
  always derive the owner from the authenticated reader session.
- Creator handles are lowercase, globally unique, and immutable after creation
  so future profile and attribution URLs remain stable.

## Self-service onboarding

An authenticated reader with a verified email can create a profile at `/creator`.
The API serializes onboarding per reader with a PostgreSQL advisory transaction
lock, then creates the profile and, when needed, the `CREATOR` role grant plus its
append-only grant event in one transaction.

An existing active creator grant is reused. A revoked grant is never reactivated
through onboarding; the request fails and requires staff review. Profile updates
also require an active creator role, so revocation immediately blocks changes
without deleting the public identity or its listings.

Seed operations intentionally omit `ownerUserId`. Do not backfill seeded creators
to real accounts based on email, display name, or handle. A future ownership
transfer or claim workflow must verify control and append dedicated audit events
before changing this field.
