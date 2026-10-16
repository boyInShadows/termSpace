import { CreatorHub } from "@/features/creator/creator-hub";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].navStudio };
}

export default function CreatorStudioPage() {
  return <CreatorHub />;
}
