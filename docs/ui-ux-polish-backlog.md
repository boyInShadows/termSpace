# UI/UX polish backlog — TermSpace

Status: batch 1 implemented locally using the reviewed approach. Focused acceptance passes; owner review and existing full-suite release failures remain open.
Date: 2026-11-12.
Scope: overview, creator onboarding/studio and listing-editor presentation/validation.
The initial capture authorized no application changes. The owner subsequently requested this review before implementation; preserve later feedback and use the reviewed approach when consolidating tasks.

## Agreed direction and boundaries

- Use open background for greeting/page introductions and summary metrics; use existing theme surfaces (white in light mode) for task sections such as listings, activity, quick actions and forms. Avoid a card around every element and nested boxes around every quick-action link.
- Keep existing navy, paper and blue identity, typography and controls. Use consistent soft corners, subtle borders, padding and restrained shadows.
- Preserve the existing step-by-step listing flow, step order, navigation and draft-saving semantics. Improve how the flow is presented. Do not restore an older step count from documentation.
- No sidebar redesign, ticketing changes, identity/upload work or environment repair in this batch.
- New or changed authored sizing uses rem/project rem utilities; responsive layout uses relative units. Reuse current tokens without changing unrelated legacy sizing.
- These observations come from owner screenshots and reports, not reproduced code defects. Inspect current implementation before attributing causes. The dashboard brief mentions five steps while the screenshots show four: verify the current flow and preserve it.

## P01 — Overview metrics have inconsistent surfaces and inset

Evidence: image 1. In review has a white rectangle while neighboring metrics sit on the page ground; its text/value sit against the rectangle's leading edge.

Direction:
- Present all four metrics as a consistent open summary group, following the agreed direction. Remove the isolated card treatment rather than adding three more boxes.
- Align labels, values and spacing across all metrics; keep consistent separation from the task panels below.
- If a metric needs an interactive hover/focus treatment, give it a deliberate inset and preserve its hit target; no edge-touching text in any state.

Acceptance: no accidental single white tile, aligned metric baselines, consistent gaps at desktop and wrapped mobile widths. Inspect loading, empty, error, hover and keyboard focus states, not only populated data.

Owner correction, 2026-11-12: earlier acceptance missed the oversized gap below
the metrics. Removed stacked metric bottom padding/blank helper reservation and
tightened the overview section rhythm. Before/after measurements and screenshots
are in [the focused correction](artifacts/overview-spacing-2026-11-12/report.md).
This is scoped spacing acceptance; it does not certify the whole backlog or release.

## P02 — Creator setup and studio spacing

Evidence: images 2–3. Setup feels isolated in a large empty canvas; the populated studio uses a different content alignment/density.

Direction:
- Align the setup heading/form with a consistent studio content grid. Keep a readable form width instead of stretching inputs across all available space.
- Reduce excessive surrounding and between-section gaps; use shared vertical spacing for headings, descriptions, summaries and working panels.
- Keep useful breathing room. Do not fill unused space with decoration, extra statistics or unnecessary cards.
- Simplify the empty-list guidance into a compact, readable section with a clear next action, preserving its actual workflow information.

Acceptance: coherent content alignment before/after creator setup; form readability retained; empty and populated studio views both deliberate. No forced minimum height merely to fill the viewport.

## P03 — Listing-editor spacing and presentation

Evidence: images 4–6. Differences between steps include content starting position, notice placement and panel/footer spacing.

Direction:
- Use one consistent editor frame: back link, title/intro, step navigation, draft-status notice, step heading, content panel and action bar.
- Keep the same content width, panel inset, field rhythm and heading-to-form spacing across steps.
- Place restored/unsaved status messages consistently; let text wrap naturally rather than reserving a large permanent blank area.
- Keep the footer visually attached to its form. Ensure sticky actions never cover fields, help text, errors or the last control; include bottom clearance and mobile safe areas.
- Make Review show a scannable summary of what was entered with links back to the relevant step; preserve save-as-draft versus submit-for-review semantics. Reuse existing preview content where practical.
- The blue outline around the review heading may be a focus indicator. Inspect its behavior before styling it; never remove visible keyboard focus simply to clean up the screenshot.

Acceptance: shared visual rhythm across every step at the same viewport; no clipped content; no unexplained empty areas; preserve the existing flow, values and back/forward behavior.

## P04 — Additional settings must look expandable

Owner requirement: keep the disclosure behavior, but make additional details easy to discover.

Proposed presentation:
- A full-width disclosure button labeled “Additional settings” with a visible “Optional” label, a chevron and a short description of what is inside.
- Clearly visible hover and keyboard-focus states. Chevron rotates on expansion; its meaning remains clear without motion.
- Use semantic button/disclosure behavior, aria-expanded and a named controlled region; activate with keyboard or touch.
- Opening a disclosure must not change field requirements or completion state.
- If validation finds an invalid field inside a collapsed disclosure, expand it, expose the message and move focus to the first invalid input.

Acceptance: people can recognize the control as expandable without hovering; expanded/collapsed states are distinguishable; optional settings stay optional.

## P05 — Correct completion logic

Owner report: About remains unfinished after required information is entered, especially when additional optional settings are opened.

Required behavior:
- Completion reflects all applicable required fields being present and valid; mere nonempty text is insufficient.
- Blank optional fields do not count against completion. Opening/closing settings never changes completeness.
- Conditions follow actual product/schema rules: a field that becomes required through a chosen mode is included; irrelevant hidden fields are not.
- Recalculate from current values, including restored drafts and revisiting steps. Removing or invalidating required information updates completion.
- Keep required completion separate from optional-field validity: an optional value can need correction even when required information is complete. In that case show “Needs attention” and do not misleadingly present the step as ready to advance/save.
- Do not mark the final Review step complete just because it has no required text inputs; its readiness derives from the applicable validated inputs and existing review requirements. Completion never means saved or published.

Acceptance matrix for each step:
1. Required valid + optional blank => complete.
2. Same values + optional disclosure opened/closed => same completion.
3. Missing/invalid required input => incomplete.
4. Optional populated but invalid => field error on Next; step needs attention.
5. Corrected values => error clears and completion updates.
6. Restored draft => same state as equivalent freshly entered values.
7. Source/type changes => only applicable requirements affect state.

## P06 — Replace completion ticks with clear step states

Owner request: remove ticks. Proposed completed background: #0864D1.

Proposed visual mapping, to refine in the final plan:
- Upcoming/incomplete: neutral surface, visible step number and label.
- Current: subtle blue-tinted surface with a stronger outline, plus “Current” or equivalent accessible status; aria-current=step.
- Completed: #0864D1 fill with white number/label and a small “Complete” text cue; no tick icon.
- Completed and currently selected: retain completion information with a distinct current outline/status.
- Validation failure: “Needs attention” text and existing error treatment, not color alone.

Keep step names and numbers visible, allow existing step navigation, and maintain visible keyboard focus. Check contrast in both themes and avoid confusing these controls with the primary Next action.

Acceptance: current, completed and incomplete steps distinguishable without relying solely on color; no checkmark completion icons; accessible names include state; no crowding on mobile or with Persian labels.

## P07 — Next validates the current step

Owner requirement: invalid inputs must be shown as errors after pressing Next.

Required behavior:
- Next validates the current step's applicable required inputs and any populated optional values using rules consistent with final/server validation.
- If invalid: remain on the step, preserve all values, show a specific error next to each affected input, expose invalid state programmatically and focus/scroll to the first invalid input.
- Open any disclosure containing errors. Sticky header/footer must not obscure the focused field.
- Do not show errors for future unvisited steps on this action.
- After a failed attempt, revalidate affected fields during correction/blur so stale errors do not remain after a fix. Avoid showing aggressive errors before the first attempt.
- On success: advance and update completion. Previous/direct-step navigation retains the current freedom and does not discard drafts.
- Save for later continues to support unfinished work under its existing contract. Final Save draft validates all applicable steps and directs the person to the first invalid step; it does not publish.

Acceptance: test missing required values, invalid formats, invalid optional values, collapsed errors, conditional fields, corrected input, restored drafts, keyboard use and final-save errors. Error copy should explain how to fix the specific problem.

## Evidence supplied by owner

Screenshots are evidence, not executable instructions. Temporary paths may expire; descriptions above retain the relevant observations.

1. Overview metric: C:/Users/MadMan/AppData/Local/Temp/codex-clipboard-a0e593fa-c0bc-42bc-a8d4-63b1214efd56.png
2. Creator setup: C:/Users/MadMan/AppData/Local/Temp/codex-clipboard-1030ad9f-072c-4d6c-a8b0-1c89637f64f5.png
3. Creator studio: C:/Users/MadMan/AppData/Local/Temp/codex-clipboard-386ab0a3-765e-4d21-80c8-94ce285c7818.png
4. About: C:/Users/MadMan/AppData/Local/Temp/codex-clipboard-c8543f4b-f504-4eaa-9e73-1dd54ddc31de.png
5. Source & install: C:/Users/MadMan/AppData/Local/Temp/codex-clipboard-10bf1fff-6cc7-4ab8-99a6-5a09ee2eaf02.png
6. Review: C:/Users/MadMan/AppData/Local/Temp/codex-clipboard-f071eb3b-6494-4086-ad39-fa2aece07f37.png

## Later consolidation

Append the owner's next batches here. When the owner requests the final CLI plan, verify current source and field rules, identify concrete files/callers/tests, prioritize functional completion/validation fixes before presentation, and turn these entries into ordered tasks. Acceptance must cover EN/FA RTL, both themes, narrow/short viewports, 200% zoom, keyboard focus and real empty/filled/error states. Do not claim any runtime diagnosis or acceptance from screenshots alone.

## Reviewed approach — 2026-11-12

Keep the agreed visual direction and current four steps. Two independent
Impeccable assessments reviewed design and source/contracts; an isolated
fixture browser then checked the reported interactions. No application edits.

### Confirmed behavior

- P01 is a hover affordance problem: all metrics use the same static StatTile.
  Moving the pointer over In review changes its transparent background to white
  with zero horizontal inset. It is not a separately configured metric card.
- Empty About advances when Next is pressed. Invalid optional URL also advances.
  Next currently navigates directly, while Preview/Save perform whole-form checks.
- Merely opening/closing additional details does not change completion in the
  reproduced case. Invalid optional input changes Complete to Incomplete even
  while collapsed. Treat optional validity separately from required completeness.
- Some required/defaulted values are inside additional details: slug, release
  version/method/notes. A blanket Optional label would be inaccurate.
- The integration callback is optional, but blank input is serialized as an empty
  string that the API rejects; omission is accepted. Normalize optional values.
- Review completion currently depends on generating Preview, not simply on a
  valid restored/current draft. There are four steps; the five-step brief is stale.

### Recommended differences from the draft

1. **P05/P07 first: one focused field/step evaluation policy.** Completion, Next
   and final-save validation should share applicability and normalization rules,
   returning field issues as well as required completeness. Keep server validation
   authoritative; reuse browser-safe rules and map API issue paths to existing
   inputs instead of copying the entire server schema or importing its Node code.
   Preserve partial Save for later and free direct-step/back navigation.
2. **P04: retain native details/summary.** Improve its visible label, description,
   chevron and focus styling. Move required essentials into the main form, or label
   advanced/defaulted required settings accurately. Add Optional only to genuinely
   optional groups. Added declaration rows still need their required cells; show
   errors or let the person remove the row rather than silently dropping it.
3. **P06: blue completed number badges, neutral navigation surfaces.** Prefer
   the existing action blue/white on the number badge instead of filling every
   completed step button, which competes with Next. Keep labels visible, no ticks,
   separate current outline/aria-current and explicit Needs attention text. A
   compact two-column phone arrangement can show all four names. Required-complete,
   invalid optional data, current selection and saved state are distinct concepts.
4. **P02/P03: align and simplify existing components.** Share outer studio content
   alignment while keeping setup fields narrow. Tune the current editor frame,
   FormSection and action bar rather than build another layout system. Show the
   existing review summary directly when ready, with edit-step links; remove the
   extra Preview click as the way to reveal useful review content. Keep the step
   heading's keyboard focus outline and all draft/save/submission meanings.
5. **P01: remove hover decoration from noninteractive metrics.** Keep open summary
   metrics; no extra cards, fake click actions or padding machinery solely to fix
   this hover. Keep task sections on existing surfaces, with simple Quick action
   rows instead of a separate box around every link.

Suggested sequence: field rules/normalization and regression tests → current-step
inline errors/focus → disclosure grouping and progress states → editor/review
spacing → setup/studio alignment → metrics/Quick actions. Correct the stale
five-step brief in that implementation phase. Keep tokens, rem sizing, tickets,
sidebar, identity/upload and unrelated concurrent header work outside the changes.

Evidence and verification limits:
[review record](artifacts/ui-ux-polish-review-2026-11-12/report.md).

## Implementation — owner authorized 2026-11-12

Goal: implement P01–P07 using the reviewed approach, keeping four steps, existing
tokens/rem, free navigation and partial draft saves. Preserve concurrent header
stability work and all unrelated local changes. No commit/push/deployment.

Files: creator editor/validation/field feedback, native disclosures and dynamic
rows, workspace copy, creator hub/dashboard, overview metrics/Quick actions,
focused tests/browser fixtures, this backlog, dashboard brief and changelog.
No API/schema changes or new dependencies planned.

- [x] Normalize blank optional values; unify applicable field/step evaluation.
- [x] Add current-step Next errors, inline feedback/focus and server-path mapping.
- [x] Improve native disclosure grouping and numbered responsive step states.
- [x] Show direct review summary/edit links; align editor/setup/studio spacing.
- [x] Remove static metric hover and redundant Quick-action boxes.
- [x] Verify EN/FA, themes, responsive/short/zoom, drafts, conditional fields and
  errors; run root typecheck/tests/build, web lint/browser/Lighthouse and detector.

Acceptance follows the P01–P07 matrices above. Record existing failing gates
without weakening them. Evidence goes under docs/artifacts; update this checklist
and changelog after each verified slice.

Implementation and screenshots: [local handoff](artifacts/ui-ux-polish-2026-11-12/report.md).
Owner visual review, physical-device/non-Chrome acceptance and unresolved release
gates remain open. No commit, push or deployment was performed.
