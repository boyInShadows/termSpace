# Marketplace operations and growth

The creator add-listing route uses a seven-step flow: identity, presentation, release, requirements, license, item details, and review. Each step checks its visible native form constraints. The final submission still uses the existing validated draft API. Unsaved fields and the current step are kept in browser session storage until the draft is saved.

Dashboard notifications are an in-app view of existing listing lifecycle events, published reviews, reports, and source-check failures. Reader notifications cover lifecycle updates after an item is acquired or favorited. Each inbox stores one read timestamp on the reader account; no new delivery worker or email subscription is required. Marketplace creator and member permissions remain separate from Blog editorial roles.

Creator analytics records daily listing-view and installation-detail-view counts without visitor IDs, IP addresses, or user agents. Browsers count at most one listing view per tab session and UTC day; the API also rate-limits anonymous view posts. This is an approximate view metric, not a count of unique people or completed installations. The dashboard compares 30-day acquisitions to 30-day views, shows installation-detail views per recent acquisition, groups all completed acquisitions by pinned release, and displays rating snapshots on days when ratings change. Historical views before this migration are unavailable.

Creators can mark a listing active, deprecated, or abandoned with a public explanation. The public product page exposes current release requirements, compatibility notes, and source-check status. These labels inform readers; they do not execute or reveal the submitted artifact.

Marketplace staff collections and community collections live in separate tables from creator collections and Blog content. Administrators manage staff shelves; moderators and administrators manage community shelves. Community shelves accept only public listings with an approved placement in that community. Public collection contents and counts update with current listing and placement visibility.
