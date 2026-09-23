"use client";
import { FormEvent, useState } from "react";
import { ApiError, createMyProduct } from "@/lib/api";
import type {
  AIModel,
  OwnedProduct,
  Platform,
  ProductType,
  PublishingCategory,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";

const PRODUCT_TYPES: ProductType[] = [
  "Prompt", "Prompt pack", "Skill", "Agent", "Workflow", "MCP server", "AI tool", "Developer utility",
];
const PLATFORMS: Platform[] = ["ChatGPT", "Claude", "Codex", "Cursor", "VS Code", "Gemini", "API"];
const MODELS: AIModel[] = ["GPT-5", "Claude 4", "Gemini 2.5", "Model agnostic"];

const FIELD =
  "mt-2 w-full rounded-md border border-input bg-surface px-3 text-sm min-h-11 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

function slugFrom(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

/** A checkbox group that keeps its selection in component state. */
function CheckboxGroup<T extends string>({
  legend, options, selected, onToggle,
}: {
  legend: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition ${
                checked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border-strong"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onToggle(option)}
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SubmitSkillForm({
  categories,
  onPublished,
}: {
  categories: PublishingCategory[];
  onPublished: (product: OwnedProduct) => void;
}) {
  const { t } = useLocale();
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>(["Claude"]);
  const [models, setModels] = useState<AIModel[]>(["Model agnostic"]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle<T extends string>(setter: (fn: (current: T[]) => T[]) => void, value: T) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!platforms.length || !models.length) {
      setError(t.dashSelectAtLeastOne);
      return;
    }
    setSubmitting(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const product = await createMyProduct({
        name: String(data.get("name")).trim(),
        slug: slug || slugFrom(String(data.get("name"))),
        type: String(data.get("type")) as ProductType,
        category: String(data.get("category")),
        outcome: String(data.get("outcome")).trim(),
        description: String(data.get("description")).trim(),
        platforms,
        models,
        tags: String(data.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8),
      });
      form.reset();
      setSlug("");
      setSlugEdited(false);
      onPublished(product);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t.serviceError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-7">
      <h2 className="editorial text-2xl">{t.dashPublishTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.dashPublishIntro}</p>

      <form className="mt-6 space-y-5" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {t.dashName}
            <Input
              name="name"
              required
              minLength={3}
              maxLength={120}
              className="mt-2"
              onChange={(event) => {
                if (!slugEdited) setSlug(slugFrom(event.target.value));
              }}
            />
          </label>

          <label className="block text-sm font-medium">
            {t.dashSlug}
            <Input
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value.toLowerCase());
              }}
              className="mt-2"
            />
            <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
              {t.dashSlugHint}
            </span>
          </label>

          <label className="block text-sm font-medium">
            {t.dashType}
            <select name="type" required defaultValue="Skill" className={FIELD}>
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            {t.dashCategory}
            <select name="category" required className={FIELD}>
              {categories.map((category) => (
                <option key={category.slug} value={category.name}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium">
          {t.dashOutcome}
          <Input name="outcome" required minLength={10} maxLength={180} className="mt-2" />
          <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
            {t.dashOutcomeHint}
          </span>
        </label>

        <label className="block text-sm font-medium">
          {t.dashDescription}
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={4000}
            rows={5}
            className="mt-2 w-full rounded-md border border-input bg-surface p-3 text-sm hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
            {t.dashDescriptionHint}
          </span>
        </label>

        <CheckboxGroup
          legend={t.dashPlatforms}
          options={PLATFORMS}
          selected={platforms}
          onToggle={(value) => toggle(setPlatforms, value)}
        />
        <CheckboxGroup
          legend={t.dashModels}
          options={MODELS}
          selected={models}
          onToggle={(value) => toggle(setModels, value)}
        />

        <label className="block text-sm font-medium">
          {t.dashTags}
          <Input name="tags" maxLength={200} className="mt-2" />
          <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
            {t.dashTagsHint}
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        )}

        <Button disabled={submitting}>
          {submitting ? t.dashPublishing : t.dashPublishCta}
        </Button>
      </form>
    </section>
  );
}
