"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import type { ArticleDetail, Author, Category, MediaAsset, Series, Tag } from "@/lib/types";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface ArticleFormProps {
  authors: Author[];
  categories: Category[];
  article?: ArticleDetail;
  tags: Tag[];
  series: Series[];
  media: MediaAsset[];
}

interface FieldErrors {
  [key: string]: string;
}

const editorialTemplates = {
  timeline: ":::timeline\n2026 | What changed and why it matters\n2027 | What happened next\n:::",
  annotations: ":::annotations\nClaim or artifact | Editorial context and source\n:::",
  interview: ":::interview\nInterviewer | Question\nGuest | Answer\n:::",
  data: ":::data\nMeasure | Value and source\n:::",
  compare: ":::compare\nOne argument | A competing argument\n:::",
} as const;

export function ArticleForm({ authors, categories, tags, series, media, article }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? "");
  const [kind, setKind] = useState<"ARTICLE" | "SIGNAL">(article?.kind ?? "ARTICLE");
  const [perspectivePrompt, setPerspectivePrompt] = useState(article?.perspectivePrompt ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [heroImage, setHeroImage] = useState(article?.heroImage ?? "");
  const [published, setPublished] = useState(article?.published ?? false);
  const [authorId, setAuthorId] = useState(article?.author.id ?? "");
  const [categoryId, setCategoryId] = useState(article?.category.id ?? "");
  const [tagIds, setTagIds] = useState(article?.tags.map((tag) => tag.id) ?? []);
  const [seriesId, setSeriesId] = useState(article?.series?.id ?? "");
  const [seriesOrder, setSeriesOrder] = useState(article?.seriesOrder?.toString() ?? "");
  const [scheduledAt, setScheduledAt] = useState(article?.scheduledAt ? article.scheduledAt.slice(0, 16) : "");
  const [autosaveStatus, setAutosaveStatus] = useState("");
  const [version, setVersion] = useState(article?.updatedAt);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const previewHtml = renderMarkdown(content);
  const currentSignature = JSON.stringify({ title, kind, perspectivePrompt, slug, excerpt, content, heroImage, published, authorId, categoryId, tagIds: [...tagIds].sort(), seriesId, seriesOrder, scheduledAt });
  const savedSignature = useRef(currentSignature);
  const hasChanges = currentSignature !== savedSignature.current;

  useEffect(() => {
    if (!hasChanges || saving) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, saving]);

  useEffect(() => {
    if (!article || !hasChanges || title.trim().length < 3 || content.trim().length < 10 || !authorId || !categoryId) return;
    setAutosaveStatus("Unsaved changes");
    const timeout = window.setTimeout(async () => {
      try {
        setAutosaveStatus("Autosaving…");
        const saved = await api.updateArticle(article.id, {
          expectedUpdatedAt: version,
          kind, perspectivePrompt: perspectivePrompt.trim() || null,
          title: title.trim(), slug: slug.trim(), excerpt: excerpt.trim() || null, content,
          heroImage: heroImage.trim() || null, published, authorId, categoryId, tagIds,
          seriesId: seriesId || null, seriesOrder: seriesOrder ? Number(seriesOrder) : null,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        });
        setVersion(saved.data.updatedAt);
        savedSignature.current = currentSignature;
        setAutosaveStatus("Autosaved");
      } catch {
        setAutosaveStatus("Autosave failed");
      }
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [article, hasChanges, currentSignature, title, kind, perspectivePrompt, slug, excerpt, content, heroImage, published, authorId, categoryId, tagIds, seriesId, seriesOrder, scheduledAt, version]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (title.trim().length < 3) next.title = "Title must be at least 3 characters.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      next.slug = "Slug must be lowercase with hyphens (e.g. my-post).";
    }
    if (content.trim().length < 10) next.content = "Content must be at least 10 characters.";
    if (kind === "SIGNAL" && content.length > 1200) next.content = "Signals must be 1,200 characters or fewer.";
    if (!authorId) next.authorId = "Please choose an author.";
    if (!categoryId) next.categoryId = "Please choose a category.";
    if (heroImage && !/^https?:\/\/.+/.test(heroImage)) {
      next.heroImage = "Hero image must be a valid URL.";
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setSubmitError("");
    const payload = {
      title: title.trim(),
      kind,
      perspectivePrompt: perspectivePrompt.trim() || null,
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      heroImage: heroImage.trim() || null,
      published,
      authorId,
      categoryId,
      tagIds,
      seriesId: seriesId || null,
      seriesOrder: seriesOrder ? Number(seriesOrder) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      expectedUpdatedAt: version,
    };

    try {
      if (isEdit && article) {
        const saved = await api.updateArticle(article.id, payload);
        setVersion(saved.data.updatedAt);
        savedSignature.current = currentSignature;
      } else {
        await api.createArticle(payload);
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save article.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-lg border ${errors[field] ? "border-red-400" : "border-line"} bg-paper-card px-4 py-2.5 text-ink placeholder:text-ink-faint focus:border-accent`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {submitError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700" role="alert">
          {submitError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div><label htmlFor="article-kind" className="mb-1 block text-sm font-medium text-ink-soft">Editorial format</label><select id="article-kind" value={kind} onChange={(event) => setKind(event.target.value as "ARTICLE" | "SIGNAL")} className={inputClass("kind")}><option value="ARTICLE">Article</option><option value="SIGNAL">Signal (concise update)</option></select></div>
        <div><label htmlFor="perspective-prompt" className="mb-1 block text-sm font-medium text-ink-soft">Reader perspective prompt</label><input id="perspective-prompt" value={perspectivePrompt} onChange={(event) => setPerspectivePrompt(event.target.value)} maxLength={300} className={inputClass("perspectivePrompt")} placeholder="What would you ask readers?" /></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-ink-soft">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass("title")}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <p className="mt-1 text-sm text-red-700">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-ink-soft">
            Slug
          </label>
          <div className="flex gap-2">
            <input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass("slug")}
              aria-invalid={Boolean(errors.slug)}
            />
            <button
              type="button"
              onClick={() => setSlug(slugify(title))}
              className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-accent"
            >
              Auto
            </button>
          </div>
          {errors.slug && <p className="mt-1 text-sm text-red-700">{errors.slug}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="excerpt" className="mb-1 block text-sm font-medium text-ink-soft">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className={inputClass("excerpt")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="content" className="mb-1 block text-sm font-medium text-ink-soft">
            Content (markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            maxLength={kind === "SIGNAL" ? 1200 : undefined}
            className={`${inputClass("content")} font-mono text-sm`}
            aria-invalid={Boolean(errors.content)}
          />
          {errors.content && <p className="mt-1 text-sm text-red-700">{errors.content}</p>}
          <p className="mt-1 text-xs text-ink-faint">
            Supports headings, lists, blockquotes, inline code, fenced code blocks, and editorial format blocks. Signals are limited to 1,200 characters.
          </p>
          <label htmlFor="editorial-template" className="mt-3 block text-xs font-medium text-ink-soft">Insert editorial format block</label>
          <select id="editorial-template" defaultValue="" className={`${inputClass("template")} mt-1`} onChange={(event) => { const key = event.target.value as keyof typeof editorialTemplates; if (editorialTemplates[key]) setContent((current) => `${current.trimEnd()}\n\n${editorialTemplates[key]}\n`); event.target.value = ""; }}>
            <option value="">Choose format…</option>
            <option value="timeline">Visual timeline</option><option value="annotations">Annotated case study</option><option value="interview">Interview</option><option value="data">Data story</option><option value="compare">Side-by-side argument</option>
          </select>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-ink-soft">Preview</p>
          <div
            className="prose-article min-h-[25rem] rounded-lg border border-line bg-paper-card px-4 py-3 text-base"
            dangerouslySetInnerHTML={{
              __html: previewHtml || "<p>Start writing to preview the article.</p>",
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="heroImage" className="mb-1 block text-sm font-medium text-ink-soft">
          Hero image URL
        </label>
        <input
          id="heroImage"
          value={heroImage}
          onChange={(e) => setHeroImage(e.target.value)}
          placeholder="https://…"
          className={inputClass("heroImage")}
          aria-invalid={Boolean(errors.heroImage)}
        />
        {errors.heroImage && <p className="mt-1 text-sm text-red-700">{errors.heroImage}</p>}
        {media.length > 0 && (
          <select className={`${inputClass("heroImage")} mt-2`} value="" onChange={(event) => setHeroImage(event.target.value)}>
            <option value="">Choose from media library…</option>
            {media.map((asset) => <option key={asset.id} value={asset.url}>{asset.altText}</option>)}
          </select>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="authorId" className="mb-1 block text-sm font-medium text-ink-soft">
            Author
          </label>
          <select
            id="authorId"
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className={inputClass("authorId")}
            aria-invalid={Boolean(errors.authorId)}
          >
            <option value="">Select an author…</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors.authorId && <p className="mt-1 text-sm text-red-700">{errors.authorId}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-ink-soft">
            Category
          </label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass("categoryId")}
            aria-invalid={Boolean(errors.categoryId)}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-sm text-red-700">{errors.categoryId}</p>}
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-soft">Tags</legend>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={tagIds.includes(tag.id)} onChange={(event) => setTagIds((current) => event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))} />
              {tag.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="seriesId" className="mb-1 block text-sm font-medium text-ink-soft">Series</label>
          <select id="seriesId" value={seriesId} onChange={(event) => setSeriesId(event.target.value)} className={inputClass("seriesId")}>
            <option value="">No series</option>
            {series.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="seriesOrder" className="mb-1 block text-sm font-medium text-ink-soft">Series order</label>
          <input id="seriesOrder" type="number" min="1" value={seriesOrder} onChange={(event) => setSeriesOrder(event.target.value)} className={inputClass("seriesOrder")} />
        </div>
        <div>
          <label htmlFor="scheduledAt" className="mb-1 block text-sm font-medium text-ink-soft">Schedule publication</label>
          <input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className={inputClass("scheduledAt")} />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-line accent-accent"
        />
        Publish this article
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-6 py-3 font-medium text-paper hover:bg-accent-soft disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create article"}
        </button>
        {article?.previewToken && <a href={`/preview/${article.previewToken}`} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-4 py-3 text-sm text-ink-soft hover:border-accent">Preview link</a>}
        {isEdit && <span className="text-xs text-ink-muted" aria-live="polite">{autosaveStatus}</span>}
        <button
          type="button"
          onClick={() => {
            if (hasChanges) {
              setShowDiscardDialog(true);
              return;
            }
            router.push("/admin");
          }}
          className="rounded-lg border border-line px-6 py-3 font-medium text-ink-soft hover:border-accent"
        >
          Cancel
        </button>
      </div>

      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard changes"
        description="Leave this editor and discard the unsaved article changes?"
        confirmLabel="Discard changes"
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={() => router.push("/admin")}
      />
    </form>
  );
}
