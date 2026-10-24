import { SavedListings } from "@/features/library/saved-listings";
import { savedCopy } from "@/features/library/saved-copy";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: savedCopy[await getLocale()].title };
}

export default function SavedListingsPage() {
  return <SavedListings />;
}
