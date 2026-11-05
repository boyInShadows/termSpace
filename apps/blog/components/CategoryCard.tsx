"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { Category } from "@/lib/types";
import { localePath } from "@/lib/i18n";
import { categoryNamesFa } from "@/lib/faContent";

export function CategoryCard({ category }: { category: Category }) {
  const locale = useLocale() === "fa" ? "fa" : "en";
  const name = locale === "fa" ? categoryNamesFa[category.slug] ?? category.name : category.name;
  return (
    <Link
      href={localePath(`/blog/category/${category.slug}`, locale)}
      className="group rounded-xl border border-line bg-paper-card p-6 transition-all hover:border-accent hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold group-hover:text-accent">
          {name}
        </h3>
        <span aria-hidden="true" className="text-ink-faint transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
          →
        </span>
      </div>
      {category.description && (
        <p className="mt-2 text-sm text-ink-soft line-clamp-2">{category.description}</p>
      )}
      <p className="mt-4 text-xs text-ink-muted">
        {locale === "fa" ? `${category._count?.articles ?? 0} مقاله` : `${category._count?.articles ?? 0} article${(category._count?.articles ?? 0) === 1 ? "" : "s"}`}
      </p>
    </Link>
  );
}
