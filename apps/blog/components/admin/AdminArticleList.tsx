"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ArticleSummary, Category, PaginationMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface AdminArticleListProps {
  articles: ArticleSummary[];
  initialMeta: PaginationMeta;
  categories: Category[];
}

const PAGE_SIZE = 10;

type StatusFilter = "all" | "published" | "draft";
type SortFilter = "newest" | "oldest" | "title";

export function AdminArticleList({ articles, initialMeta, categories }: AdminArticleListProps) {
  const router = useRouter();
  const [items, setItems] = useState(articles);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [articleToDelete, setArticleToDelete] = useState<ArticleSummary | null>(null);

  async function loadArticles(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const res = await api.listArticles({
        page: nextPage,
        limit: PAGE_SIZE,
        category: category || undefined,
        search: search || undefined,
        published:
          status === "published"
            ? true
            : status === "draft"
              ? false
              : undefined,
        sort,
      });
      setItems(res.data);
      setMeta(res.meta);
      setPage(res.meta.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .listArticles({
        page,
        limit: PAGE_SIZE,
        category: category || undefined,
        search: search || undefined,
        published:
          status === "published"
            ? true
            : status === "draft"
              ? false
              : undefined,
        sort,
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setMeta(res.meta);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, category, search, sort, status]);

  function resetPage() {
    setPage(1);
  }

  async function togglePublish(article: ArticleSummary) {
    setBusyId(article.id);
    setError("");
    try {
      await api.updateArticle(article.id, { published: !article.published });
      await loadArticles();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update article");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(article: ArticleSummary) {
    setBusyId(article.id);
    setError("");
    try {
      await api.deleteArticle(article.id);
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      await loadArticles(nextPage);
      setArticleToDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete article");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-xl border border-line bg-paper-card p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <label htmlFor="admin-search" className="sr-only">
          Search articles
        </label>
        <input
          id="admin-search"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          placeholder="Search articles..."
          className="w-full rounded-lg border border-line-input bg-paper-card px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
        />

        <label htmlFor="admin-status" className="sr-only">
          Status
        </label>
        <select
          id="admin-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            resetPage();
          }}
          className="rounded-lg border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-soft focus:border-accent"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>

        <label htmlFor="admin-category" className="sr-only">
          Category
        </label>
        <select
          id="admin-category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            resetPage();
          }}
          className="rounded-lg border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-soft focus:border-accent"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="admin-sort" className="sr-only">
          Sort
        </label>
        <select
          id="admin-sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortFilter);
            resetPage();
          }}
          className="rounded-lg border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-soft focus:border-accent"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-ink-muted">
        <span>
          {meta.total} result{meta.total === 1 ? "" : "s"}
        </span>
        {loading && <span role="status">Loading...</span>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper-card p-10 text-center">
          <p className="font-serif text-xl font-semibold">No articles found</p>
          <p className="mt-2 text-ink-soft">Adjust the search or filters to broaden the list.</p>
          <Link
            href="/admin/articles/new"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-paper hover:bg-accent-soft"
          >
            New article
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper-card">
          <table className="min-w-[56rem] w-full text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {items.map((article) => (
                <tr key={article.id} className="hover:bg-paper-warm">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${article.id}/edit`} className="font-medium text-ink hover:text-accent">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{article.category.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        article.published ? "bg-accent-tint text-accent" : "bg-paper-warm text-ink-muted"
                      }`}
                    >
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${article.published ? "bg-accent" : "bg-ink-faint"}`} />
                      {article.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(article.publishedAt) || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === article.id}
                        onClick={() => togglePublish(article)}
                        className="text-sm text-ink-soft hover:text-accent disabled:opacity-40"
                      >
                        {article.published ? "Unpublish" : "Publish"}
                      </button>
                      <Link href={`/admin/articles/${article.id}/edit`} className="text-sm text-ink-soft hover:text-accent">
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === article.id}
                        onClick={() => setArticleToDelete(article)}
                        className="text-sm text-red-700 hover:text-red-800 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Article pagination">
          <button
            type="button"
            disabled={!meta.hasPrevPage || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft hover:border-accent disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={!meta.hasNextPage || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft hover:border-accent disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}

      <ConfirmDialog
        error={error || undefined}
        open={Boolean(articleToDelete)}
        title="Delete article"
        description={
          articleToDelete
            ? `Delete "${articleToDelete.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete article"
        busy={Boolean(articleToDelete && busyId === articleToDelete.id)}
        onCancel={() => setArticleToDelete(null)}
        onConfirm={() => {
          if (articleToDelete) void remove(articleToDelete);
        }}
      />
    </div>
  );
}
