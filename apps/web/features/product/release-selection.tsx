"use client";

import { createContext, lazy, Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import { getProductRelease } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import type { ProductRelease, ProductVersion } from "@/lib/types";

export type ReleaseState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; release: ProductRelease };

interface ReleaseSelection {
  versions: ProductVersion[];
  selected: ProductVersion | undefined;
  select: (id: string) => void;
  /** True while the selected version is the one the page was rendered with. */
  isCurrent: boolean;
  state: ReleaseState;
}

const Selection = createContext<ReleaseSelection | null>(null);
const OtherRelease = lazy(() => import("./other-release").then((module) => ({ default: module.OtherRelease })));

export function useReleaseSelection() {
  return useContext(Selection);
}

/**
 * The version a reader is inspecting. The release the page was rendered with
 * is already in hand; any other version loads its own facts, so what the
 * reader reads and what "Add" sends are always the same release.
 */
export function ReleaseSelectionProvider({ slug, versions, release, children }: { slug: string; versions: ProductVersion[]; release: ProductRelease | null; children: ReactNode }) {
  const initial = versions.find((version) => version.version === release?.version) ?? versions[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const [loaded, setLoaded] = useState<Record<string, ProductRelease>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const selected = versions.find((version) => version.id === selectedId) ?? initial;
  const isCurrent = selected?.id === initial?.id;
  const version = selected?.version;
  const needsLoad = !isCurrent && version !== undefined && !loaded[version] && failed !== version;

  useEffect(() => {
    if (!needsLoad || version === undefined) return;
    const controller = new AbortController();
    getProductRelease(slug, version, controller.signal)
      .then((result) => setLoaded((previous) => ({ ...previous, [version]: result })))
      .catch(() => { if (!controller.signal.aborted) setFailed(version); });
    return () => controller.abort();
  }, [needsLoad, slug, version]);

  const state: ReleaseState = isCurrent
    ? release ? { status: "ready", release } : { status: "none" }
    : version !== undefined && loaded[version] ? { status: "ready", release: loaded[version] } : failed === version ? { status: "error" } : { status: "loading" };

  // Picking a version again after a failed load retries it.
  function select(id: string) {
    setFailed(null);
    setSelectedId(id);
  }

  return <Selection.Provider value={{ versions, selected, select, isCurrent, state }}>{children}</Selection.Provider>;
}

/**
 * Part of the page that describes a release: the title-block facts or the
 * provenance section. The server-rendered version for the current release is
 * passed in as children; the view for any other release only loads when
 * someone picks one.
 */
export function SelectedRelease({ view, slug, locale, children }: { view: "facts" | "provenance"; slug: string; locale: Locale; children: ReactNode }) {
  const selection = useReleaseSelection();
  if (!selection || selection.isCurrent || !selection.selected) return <>{children}</>;
  return (
    <Suspense fallback={null}>
      <OtherRelease view={view} state={selection.state} selected={selection.selected.version} latest={selection.versions[0]?.version} slug={slug} locale={locale} />
    </Suspense>
  );
}
