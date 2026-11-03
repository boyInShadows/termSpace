"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories: initial }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("Slug must be lowercase with hyphens.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.createCategory({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      });
      setCategories((prev) => [
        ...prev,
        { id: res.data.id, name: name.trim(), slug: slug.trim(), description: description.trim() || null },
      ]);
      setName("");
      setSlug("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    setBusy(true);
    setError("");
    try {
      await api.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setCategoryToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={create} className="rounded-xl border border-line bg-paper-card p-6 space-y-4">
        <h3 className="font-serif text-lg font-semibold">Add a category</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-ink-soft">Name</label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-2.5 text-ink focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="cat-slug" className="mb-1 block text-sm font-medium text-ink-soft">Slug</label>
            <div className="flex gap-2">
              <input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-2.5 text-ink focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setSlug(slugify(name))}
                className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-accent"
              >
                Auto
              </button>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-ink-soft">Description</label>
          <textarea
            id="cat-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-2.5 text-ink focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-action px-6 py-2.5 font-medium text-action-foreground hover:bg-action-hover disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add category"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper-card">
        <table className="min-w-[44rem] w-full text-left text-sm">
          <thead className="border-b border-line text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Articles</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-paper-warm">
                <td className="px-4 py-3 font-medium text-ink">{category.name}</td>
                <td className="px-4 py-3 text-ink-soft">{category.slug}</td>
                <td className="px-4 py-3 text-ink-muted">{category._count?.articles ?? 0}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCategoryToDelete(category)}
                    className="text-sm text-red-700 hover:text-red-800 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        error={error || undefined}
        open={Boolean(categoryToDelete)}
        title="Delete category"
        description={
          categoryToDelete
            ? `Delete "${categoryToDelete.name}"? Articles in this category must be moved before deletion.`
            : ""
        }
        confirmLabel="Delete category"
        busy={busy}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) void remove(categoryToDelete);
        }}
      />
    </div>
  );
}
