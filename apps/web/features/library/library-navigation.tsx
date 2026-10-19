"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { libraryCopy } from "./library-copy";
import { savedCopy } from "./saved-copy";

export function LibraryNavigation() {
  const { locale } = useLocale();
  const pathname = usePathname();
  return <nav aria-label={savedCopy[locale].collections} className="mb-6 flex flex-wrap gap-x-6 border-b border-border">
    {[["/dashboard/library", libraryCopy[locale].title], ["/dashboard/library/saved", savedCopy[locale].title]].map(([path, label]) => {
      const href = localePath(path, locale);
      return <Link key={path} href={href} aria-current={pathname === href ? "page" : undefined} className="relative inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground">
        {label}
        {pathname === href && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
      </Link>;
    })}
  </nav>;
}
