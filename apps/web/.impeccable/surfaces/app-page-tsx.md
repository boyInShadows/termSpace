---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/hero/hero.tsx"]
---

# Landing hero (`/`, first viewport)

Scope: the hero only (`components/hero/*`, `app/page.tsx`). Visitor mode: Persuade. Audience: a developer, often on a phone, about to give a tool access to their repo. Action: search by outcome. Proof: one synthetic example listing, labelled as an example. Untouched: sections below the hero, header, footer, search behaviour. Constraints: Geist, Geist Mono and Estedad only (no new font files); home first-load JS under 190 KiB; 24 px targets; Persian mirrors fully; readable with no JavaScript; no animation. Unresolved: whether `termspace add` exists as a real CLI; Persian copy awaits the owner's review.

## Direction contract

THESIS: A listing is a part with a datasheet, and the hero is that datasheet. The page refuses the category default of a headline over a search over a row of cards, and it refuses the nebula and the gradient headline the site had.

OWN-WORLD: Semiconductor datasheet. A title block with a revision table, thin double rules, numbered sections, tabular values, a header cell in solid ink. Theme tokens only: ink and ground, hairlines, one accent (the site's primary, on Search and the table header rule), one red mark for "not declared", one green for "reviewed". No gradients, glow, photography or textures; the one graphic is a small pin diagram drawn as plain SVG lines.

STORY: The visitor reads what TermSpace is, sees that a listing states what it reads, writes and calls out to, and searches. They believe the claim because the example shows it in a table, with the undeclared rows marked rather than hidden.

FIRST VIEWPORT: Left, the headline (two to three lines, balanced) and subcopy; right, a bordered revision table (document, revision, safety review, pinned release). Under them the full-width search with a visible "Find a listing" cell on its left and the Search button, with the type shortcuts as one quiet underlined line beneath. Below that, the bordered example part: a solid-ink tag cell reading "Example listing", the name and meta, a revision cell, then three columns (features, absolute maximum ratings, pin diagram), an ordering row with the pinned release and install command, and a one-line footer. On a phone the revision table is dropped, the columns stack, and the search stays above the fold.

FORM: Datasheet, position 1 on the ordered list (the pick card). The roll assigned another direction; the owner chose this one, and a pinned choice beats the roll. seed: none (no reference was printed by the roll)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
