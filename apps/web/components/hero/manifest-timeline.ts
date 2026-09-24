/**
 * The hero manifest's install journey as a pure function of elapsed time.
 *
 * The component owns one requestAnimationFrame clock that only advances
 * while playing; everything visible is derived from that one number here.
 * Pausing is therefore a single flag, and every frame is testable.
 *
 * Storyboard: plan.md, Part B §2. Times are milliseconds from the start.
 */

export type ManifestPhase =
  "idle" | "typing" | "resolving" | "unfolding" | "installing" | "done";

export const COMMANDS = {
  search: 'termspace search "review my PR like a staff engineer"',
  inspect: "termspace inspect conversion-copywriter",
  add: "termspace add conversion-copywriter@2.4.0",
} as const;

export const MANIFEST_ROWS: ReadonlyArray<readonly [string, string]> = [
  ["type", "Skill · v2.4.0"],
  ["platforms", "Claude · ChatGPT · Codex"],
  ["permissions", "reads selection · no network"],
  ["license", "MIT"],
  ["reviewed", "safety pass · 2 days ago"],
];

type Typed = { start: number; charsPerSecond: number; text: string };

const SEARCH: Typed = { start: 600, charsPerSecond: 34, text: COMMANDS.search };
const INSPECT: Typed = {
  start: 2800,
  charsPerSecond: 40,
  text: COMMANDS.inspect,
};
const ADD: Typed = { start: 5400, charsPerSecond: 50, text: COMMANDS.add };

const RESULT_AT = 2200;
const ROWS_AT = 3800;
const ROW_STAGGER = 120;
/** A chip lands once its row has finished entering. */
const ROW_ENTER = 240;
const VERIFIED_LINE_AT = 5000;
const INSTALLED_AT = 6250;
export const DONE_AT = 6400;

const PERMISSIONS_ROW = 2;
const REVIEWED_ROW = 4;

export type ManifestFrame = {
  phase: ManifestPhase;
  /** Characters of each command shown so far. */
  typed: { search: number; inspect: number; add: number };
  /** Which command line the caret sits on; null once everything is typed. */
  caret: "search" | "inspect" | "add" | null;
  result: boolean;
  /** How many manifest rows are visible. */
  rows: number;
  verified: boolean;
  installed: boolean;
  chips: { network: boolean; verified: boolean; version: boolean };
};

function typedAt(command: Typed, t: number): number {
  if (t < command.start) return 0;
  const chars = Math.floor(
    ((t - command.start) / 1000) * command.charsPerSecond,
  );
  return Math.min(chars, command.text.length);
}

function rowsAt(t: number): number {
  if (t < ROWS_AT) return 0;
  return Math.min(
    MANIFEST_ROWS.length,
    Math.floor((t - ROWS_AT) / ROW_STAGGER) + 1,
  );
}

function rowLandedAt(row: number): number {
  return ROWS_AT + row * ROW_STAGGER + ROW_ENTER;
}

function phaseAt(t: number): ManifestPhase {
  if (t >= DONE_AT) return "done";
  if (t >= ADD.start) return "installing";
  if (t >= ROWS_AT) return "unfolding";
  if (t >= RESULT_AT) return "resolving";
  if (t >= SEARCH.start) return "typing";
  return "idle";
}

function caretAt(t: number): ManifestFrame["caret"] {
  if (t >= INSTALLED_AT) return null;
  if (t >= ADD.start) return "add";
  if (t >= INSPECT.start) return "inspect";
  return "search";
}

export function frameAt(t: number): ManifestFrame {
  return {
    phase: phaseAt(t),
    typed: {
      search: typedAt(SEARCH, t),
      inspect: typedAt(INSPECT, t),
      add: typedAt(ADD, t),
    },
    caret: caretAt(t),
    result: t >= RESULT_AT,
    rows: rowsAt(t),
    verified: t >= VERIFIED_LINE_AT,
    installed: t >= INSTALLED_AT,
    chips: {
      network: t >= rowLandedAt(PERMISSIONS_ROW),
      verified: t >= rowLandedAt(REVIEWED_ROW),
      version: t >= INSTALLED_AT,
    },
  };
}

/** The held final frame: what reduced motion and a finished run show. */
export const DONE_FRAME = frameAt(DONE_AT);

/** A cheap identity for a frame, so the clock only re-renders on change. */
export function frameKey(frame: ManifestFrame): string {
  const { typed, chips } = frame;
  return [
    frame.phase,
    typed.search,
    typed.inspect,
    typed.add,
    frame.caret,
    frame.result,
    frame.rows,
    frame.verified,
    frame.installed,
    chips.network,
    chips.verified,
    chips.version,
  ].join("|");
}
