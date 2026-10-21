import { Suspense } from "react";
import { AcquiredLibrary } from "@/features/library/acquired-library";
import { libraryCopy } from "@/features/library/library-copy";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: libraryCopy[await getLocale()].title };
}

export default async function DashboardLibraryPage() {
  const locale = await getLocale();
  return <Suspense fallback={<p role="status">{libraryCopy[locale].loading}</p>}><AcquiredLibrary /></Suspense>;
}
