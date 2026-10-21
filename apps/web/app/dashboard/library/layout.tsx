import { LibraryNavigation } from "@/features/library/library-navigation";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <><LibraryNavigation />{children}</>;
}
