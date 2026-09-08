import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { categories as marketplaceCategoryNames, creators as marketplaceCreators, products as marketplaceProducts, reviews as marketplaceReviews, versions as marketplaceVersions } from "./marketplaceData.js";

const prisma = new PrismaClient();

/**
 * Seed script: creates authors, categories, and articles.
 * Idempotent — safe to run multiple times.
 */

const authors = [
  {
    name: "Maya Chen",
    bio: "Staff software engineer focused on distributed systems and developer tooling. Previously at a large cloud provider.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-376a8335c7ce?w=200&h=200&fit=crop",
  },
  {
    name: "Jonas Lindqvist",
    bio: "Product designer and writer exploring the intersection of craft, technology, and everyday productivity.",
    avatarUrl: "https://images.unsplash.com/photo-1507003309349-9c8c5f0f0f0f?w=200&h=200&fit=crop",
  },
];

const categories = [
  { name: "Artificial Intelligence", slug: "artificial-intelligence", description: "Ideas and practice around modern AI systems." },
  { name: "Software Engineering", slug: "software-engineering", description: "Craft, architecture, and the daily work of building software." },
  { name: "Productivity", slug: "productivity", description: "Calm, sustainable ways to do meaningful work." },
  { name: "Design", slug: "design", description: "Design thinking, craft, and the details that matter." },
  { name: "Technology", slug: "technology", description: "The tools and trends shaping the future." },
];

const tags = [
  { name: "AI", slug: "ai", description: "Applied artificial intelligence and language models." },
  { name: "Architecture", slug: "architecture", description: "Software structure and technical decisions." },
  { name: "Career", slug: "career", description: "Growing as a thoughtful technology professional." },
  { name: "Craft", slug: "craft", description: "Care, quality, and durable working practices." },
  { name: "Design Systems", slug: "design-systems", description: "Coherent interfaces and visual systems." },
  { name: "Focus", slug: "focus", description: "Attention, habits, and meaningful productivity." },
  { name: "Writing", slug: "writing", description: "Writing as a tool for communication and thought." },
];

const series = [
  { name: "Building Better Software", slug: "building-better-software", description: "Practical notes on software craft, architecture, and engineering careers." },
  { name: "Calm Digital Work", slug: "calm-digital-work", description: "Designing tools and habits that protect attention." },
];

const markdownResources = [
  {
    title: "Project Brief Template", slug: "project-brief-template", category: "Planning",
    description: "Define a project's problem, goals, scope, constraints, and measures of success before implementation.", fileName: "project-brief-template.md",
    content: `# Project Brief

## Summary

Describe the problem and proposed outcome in two or three sentences.

## Goals

- State the measurable result this project should achieve.
- Identify who benefits and how.

## Non-goals

- List work explicitly outside the current scope.

## Requirements

- **Must have:**
- **Should have:**
- **Could have:**

## Constraints and risks

Record technical, schedule, security, or dependency constraints. Assign an owner and mitigation to each material risk.

## Success measures

- Metric:
- Current baseline:
- Target:
- Review date:`,
  },
  {
    title: "Code Review Checklist", slug: "code-review-checklist", category: "Engineering",
    description: "A practical checklist for reviewing correctness, security, maintainability, testing, and delivery risk.", fileName: "code-review-checklist.md",
    content: `# Code Review Checklist

## Correctness

- Does the change satisfy the stated requirement?
- Are failure paths, boundary values, and empty states handled?
- Are migrations and compatibility concerns addressed?

## Security and privacy

- Is untrusted input validated at the system boundary?
- Are authentication and authorization enforced server-side?
- Could logs, errors, or tracked files expose sensitive data?

## Maintainability

- Are names and abstractions clear?
- Is duplicated or unreachable code avoided?

## Tests and delivery

- Do tests cover changed behavior and likely regressions?
- Do type-checking, tests, and production builds pass?
- Are configuration and deployment steps documented?`,
  },
  {
    title: "Incident Review Template", slug: "incident-review-template", category: "Operations",
    description: "Document an incident timeline, impact, contributing factors, recovery, and follow-up actions without blame.", fileName: "incident-review-template.md",
    content: `# Incident Review

## Summary

Briefly describe what happened, its duration, and current status.

## Impact

- **Start and end time:**
- **Affected users or systems:**
- **Severity:**
- **User-visible symptoms:**

## Timeline

Record the initial signal, investigation, mitigation, and recovery times.

## Contributing factors

Describe technical and organizational conditions. Focus on systems and decisions, not individuals.

## Action items

- [ ] Corrective action — **Owner:** — **Due:**
- [ ] Preventive action — **Owner:** — **Due:**
- [ ] Detection improvement — **Owner:** — **Due:**`,
  },
];

const articles = [
  {
    title: "Designing Calm Interfaces for a Noisy World",
    slug: "designing-calm-interfaces",
    excerpt: "The best interfaces don't demand attention — they earn it. A field guide to restraint, whitespace, and quiet hierarchy.",
    content: `## Start with silence

The most memorable digital products are often the quietest. They don't compete for your attention with flashing controls or dense panels. Instead, they create a sense of calm that lets the content breathe.

### Restraint is a feature

Every element you add to a screen is a promise you have to keep. Before adding a border, ask whether the space alone can do the work. Before adding a color, ask whether the type can carry the meaning.

> Good design is as little design as possible.

### Hierarchy through contrast

A strong typographic hierarchy does not require many sizes. It requires *clear* differences: a headline that is unmistakably a headline, body text that is comfortable to read, and supporting text that stays out of the way.

- Start with one typeface and one accent color
- Use whitespace as the primary separator
- Reserve motion for moments that matter

## The payoff

When an interface feels calm, users trust it. They read more, they hesitate less, and they remember the experience long after they close the tab.`,
    heroImage: "https://images.unsplash.com/photo-1518776390921-8f0a0a0a0a0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "A Practical Guide to Retrieval-Augmented Generation",
    slug: "practical-guide-to-rag",
    excerpt: "RAG is more than a buzzword. Here's how to build a grounded, useful system without over-engineering it.",
    content: `## Why grounding matters

Large language models are impressive, but they are not databases. When you need answers that reflect your own documents, retrieval-augmented generation (RAG) is the pragmatic middle path.

### The core loop

1. **Chunk** your documents into meaningful pieces.
2. **Embed** each chunk into a vector space.
3. **Retrieve** the most relevant chunks for a query.
4. **Generate** an answer conditioned on those chunks.

### Keep it simple first

Start with a naive pipeline before adding rerankers, hybrid search, or evaluation harnesses. A simple system that works is worth more than a complex one that is still being tuned.

> The best retrieval system is the one you can actually ship.

### Common failure modes

- Chunks that are too large dilute relevance
- Chunks that are too small lose context
- No evaluation means no way to improve

RAG rewards iteration. Measure, adjust, and measure again.`,
    heroImage: "https://images.unsplash.com/photo-1518776394583-8f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "The Case for Writing More by Hand",
    slug: "writing-more-by-hand",
    excerpt: "A slower medium can lead to clearer thinking. Why the humble notebook still earns its place.",
    content: `## The speed paradox

When you type, the words arrive faster than the thoughts. When you write by hand, the thoughts have to catch up. That friction is not a bug — it is the point.

### What slows you down

Handwriting forces a kind of compression. You cannot transcribe everything, so you learn to write down what matters. The result is a clearer, more honest record of your thinking.

- Handwriting improves recall
- It reduces the urge to edit prematurely
- It gives ideas room to form

> The pen is a thinking tool, not just a recording tool.

## A small practice

Keep a notebook beside your keyboard. Before you start a task, write one sentence about what you are trying to achieve. After the task, write one sentence about what you learned. That is enough.`,
    heroImage: "https://images.unsplash.com/photo-1455393580153-8f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "What Senior Engineers Actually Do",
    slug: "what-senior-engineers-do",
    excerpt: "Seniority is not about writing more code. It is about making the right code unnecessary.",
    content: `## The myth of the 10x engineer

The idea of a single engineer who writes ten times as much code is a convenient fiction. In practice, senior engineers make *less* code necessary.

### The real work

- **Removing ambiguity** before it becomes a bug
- **Designing for the next person** who reads the code
- **Saying no** to work that does not need to exist
- **Teaching** so the team compounds

> Good code is not written; it is *not* written.

## A different measure

Instead of asking "how much did you ship?", ask "how much did you prevent from being shipped that would have been a mistake?" That is the senior contribution.`,
    heroImage: "https://images.unsplash.com/photo-1516326357385-8f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "Why Your Side Project Should Be Boring",
    slug: "boring-side-projects",
    excerpt: "The most durable projects are rarely the flashiest. A case for choosing the unglamorous path.",
    content: `## The appeal of the flashy

It is tempting to build the project that will impress. But impressive projects are often abandoned, because they are built for an audience that does not exist yet.

## The appeal of the boring

A boring project — a tool you use every day, a script that saves you an hour a week — has a different kind of staying power. It is useful, so you keep using it. Because you keep using it, you keep improving it.

- Boring projects have real users: you
- They compound because they are used
- They teach you the discipline of finishing

> The best project is the one you still use in a year.

## Start small

Pick a problem you actually have. Solve it in the simplest way. Then use it. That is the whole strategy.`,
    heroImage: "https://images.unsplash.com/photo-1516326357382-8f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "Typography Is the Interface",
    slug: "typography-is-the-interface",
    excerpt: "Before the buttons, before the colors, there is the text. Why type is the foundation of every screen.",
    content: `## The interface is mostly text

Look at any screen and count the pixels that are not text. The buttons, the labels, the headings, the body — almost everything is type. Typography is not a detail; it is the interface.

### Choose a typeface with intent

A good typeface is invisible. It does not call attention to itself; it lets the words do the work. For long-form reading, a serif with generous spacing is often the most comfortable.

> Good typography is invisible. Bad typography is everywhere.

### The details that matter

- **Line length** — aim for 60 to 75 characters
- **Line height** — generous, never cramped
- **Contrast** — readable, not harsh
- **Scale** — a clear, restrained hierarchy

## A warm, editorial feel

The most sophisticated interfaces feel warm rather than corporate. They use a neutral palette, a single accent, and let the type carry the personality.`,
    heroImage: "https://images.unsplash.com/photo-1516321317382-8f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "The Art of the Small Refactor",
    slug: "art-of-the-small-refactor",
    excerpt: "Big rewrites fail. Small, continuous refactors compound. A practical approach to keeping code healthy.",
    content: `## The rewrite trap

Rewriting a system from scratch is almost always a mistake. The old system contains years of hard-won knowledge, and the new system will rediscover it the hard way.

## The small refactor

Instead of rewriting, refactor in small, safe steps. Each step keeps the system working, and each step makes the next one easier.

- Rename a variable that lies
- Extract a function that is doing too much
- Delete code that is no longer used
- Add a test before you change behavior

> Leave the code better than you found it.

## The compounding effect

A team that refactors a little every day is a team that never needs a rewrite. The code stays fresh, the knowledge stays current, and the risk stays low.`,
    heroImage: "https://images.unsplash.com/photo-1516321317388-8f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "Designing for the First Five Seconds",
    slug: "designing-for-first-five-seconds",
    excerpt: "Users decide whether to stay in the first moments. Here is how to make those moments count.",
    content: `## The first impression

In the first five seconds, a visitor decides whether your page is worth their time. They are not reading yet — they are scanning for a reason to stay.

### What earns their attention

- A clear headline that says what this is
- A visual that supports, not distracts
- A layout that is obviously organized

> You never get a second chance to make a first impression.

### What loses it

- A wall of text with no entry point
- A hero that says nothing
- A design that feels generic

The goal is not to be loud. It is to be *clear*. Clarity is the most persuasive thing a page can be.`,
    heroImage: "https://images.unsplash.com/photo-1516321317388-2f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "Notes on Building a Personal Knowledge Base",
    slug: "personal-knowledge-base",
    excerpt: "A knowledge base is not a collection of notes. It is a system for turning information into understanding.",
    content: `## Collecting is not understanding

It is easy to collect notes. It is hard to understand them. A knowledge base is only useful if it helps you think, not just store.

### The test of a good note

A note is useful if you can find it, understand it, and connect it to something else. If a note does none of those things, it is just a file.

- Write notes in your own words
- Connect notes to each other
- Review and prune regularly

> A knowledge base is a thinking tool, not a filing cabinet.

## The practice

The value is not in the tool. It is in the habit of writing things down in a way that makes them useful later. The tool is just the place where the thinking lives.`,
    heroImage: "https://images.unsplash.com/photo-1516321338-2f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "The Quiet Power of Defaults",
    slug: "quiet-power-of-defaults",
    excerpt: "The choices you make by default shape your work more than the choices you make on purpose.",
    content: `## The invisible decisions

Most of your day is not decided in the moment. It is decided by the defaults you have set — the tools you open, the time you start, the way you begin a task.

## Set better defaults

- Start the day with the most important task
- Put the tools you want to use where you can see them
- Remove the options you do not want to choose

> You do not rise to the level of your goals; you fall to the level of your systems.

## The compounding effect

A good default is a decision you only have to make once. Over time, good defaults compound into a life that runs on autopilot — in the best way.`,
    heroImage: "https://images.unsplash.com/photo-1516321338-2f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "What We Get Wrong About AI Agents",
    slug: "what-we-get-wrong-about-ai-agents",
    excerpt: "Agents are not magic. They are systems with real constraints. A grounded look at what they can and cannot do.",
    content: `## The hype

Every few months, a new demo makes agents look effortless. The reality is more modest — and more useful.

## What agents actually are

An agent is a system that takes a goal, breaks it into steps, and uses tools to make progress. The hard part is not the model. It is the reliability of the loop.

- Agents need clear boundaries
- They need to know when to stop
- They need evaluation to improve

> An agent is only as good as its ability to recover from mistakes.

## The practical view

The most useful agents are narrow. They do one thing well, with a human in the loop. That is not a limitation; it is a design choice.`,
    heroImage: "https://images.unsplash.com/photo-1516321338-2f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    title: "A Field Guide to Reading Code",
    slug: "field-guide-to-reading-code",
    excerpt: "Reading code is a skill, and it is the one most engineers never practice. Here is how to get better at it.",
    content: `## Reading is the real work

Writing code is a small part of the job. Reading code — your own and others' — is the larger part. Yet almost no one practices it.

## How to read a codebase

- **Start at the edges** — the entry points, not the internals
- **Follow one path** — trace a single request end to end
- **Read the tests** — they are the documentation
- **Take notes** — you will not remember it all

> Code is read far more often than it is written.

## The payoff

The better you read code, the faster you understand systems, the more confidently you can change them, and the less you fear the unfamiliar.`,
    heroImage: "https://images.unsplash.com/photo-1516321338-3f0a0f0a0f0a?w=1200&h=800&fit=crop",
    published: true,
  },
];

async function main() {
  console.log("Seeding database...");
  const resetSeed = process.env.SEED_RESET === "true";

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must contain at least 12 characters");
    }
    const passwordHash = await hash(adminPassword, 12);
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      // Credentials are bootstrap-only. Do not rotate a live administrator's
      // password on every ordinary seed rerun.
      update: {},
      create: { email: adminEmail, passwordHash },
    });
    console.log(`Administrator ready: ${adminEmail}`);
  } else {
    console.warn("Skipping administrator seed: set ADMIN_EMAIL and ADMIN_PASSWORD");
  }

  // Author names are not unique in the schema, so update the first matching
  // seed author or create it when absent.
  const authorRecords = [];
  for (const author of authors) {
    const existing = await prisma.author.findFirst({ where: { name: author.name } });
    const record = existing
      ? await prisma.author.update({ where: { id: existing.id }, data: author })
      : await prisma.author.create({ data: author });
    authorRecords.push(record);
  }

  // Upsert categories
  const categoryRecords = new Map();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryRecords.set(category.slug, record);
  }

  const tagRecords = [];
  for (const tag of tags) {
    tagRecords.push(await prisma.tag.upsert({ where: { slug: tag.slug }, update: {}, create: tag }));
  }

  const seriesRecords = [];
  for (const item of series) {
    seriesRecords.push(await prisma.series.upsert({ where: { slug: item.slug }, update: {}, create: item }));
  }

  for (const resource of markdownResources) {
    await prisma.markdownResource.upsert({
      where: { slug: resource.slug },
      update: {},
      create: { ...resource, size: Buffer.byteLength(resource.content), published: true, publishedAt: new Date() },
    });
  }

  // Create articles (skip if slug already exists)
  const categorySlugs = categories.map((c) => c.slug);
  let created = 0;
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const categorySlug = categorySlugs[i % categorySlugs.length];
    const author = authorRecords[i % authorRecords.length];
    const category = categoryRecords.get(categorySlug);

    const existing = await prisma.article.findUnique({ where: { slug: article.slug } });
    const selectedTags = [tagRecords[i % tagRecords.length], tagRecords[(i + 3) % tagRecords.length]];
    const selectedSeries = seriesRecords[i % seriesRecords.length];
    if (existing) {
      await prisma.article.update({
        where: { id: existing.id },
        data: {
          previewToken: !existing.previewToken || existing.previewToken.startsWith("seed-preview-") ? randomBytes(24).toString("base64url") : existing.previewToken,
          ...(resetSeed ? {
            seriesId: selectedSeries.id,
            seriesOrder: Math.floor(i / seriesRecords.length) + 1,
            tags: {
              deleteMany: {},
              create: selectedTags.map((tag) => ({ tag: { connect: { id: tag.id } } })),
            },
          } : {}),
        },
      });
      continue;
    }

    const publishedAt = new Date(Date.now() - i * 1000 * 60 * 60 * 24 * 3);
    await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        heroImage: article.heroImage,
        published: article.published,
        publishedAt,
        authorId: author.id,
        categoryId: category.id,
        seriesId: selectedSeries.id,
        seriesOrder: Math.floor(i / seriesRecords.length) + 1,
        previewToken: randomBytes(24).toString("base64url"),
        tags: { create: selectedTags.map((tag) => ({ tag: { connect: { id: tag.id } } })) },
      },
    });
    created++;
  }

  const editionArticles = await prisma.article.findMany({
    where: { slug: { in: articles.slice(0, 6).map((article) => article.slug) } },
    select: { id: true, slug: true },
  });
  const articleIdBySlug = new Map(editionArticles.map((article) => [article.slug, article.id]));
  const existingEdition = await prisma.edition.findUnique({ where: { slug: "software-and-the-human-scale" }, select: { id: true } });
  const edition = await prisma.edition.upsert({
    where: { slug: "software-and-the-human-scale" },
    update: {},
    create: {
      number: 1,
      title: "Software and the Human Scale",
      slug: "software-and-the-human-scale",
      description: "Six essays about building technology with restraint, clarity, and respect for human attention.",
      editorialNote: "Technology is often measured by capability. This edition asks a quieter question: does the software we build leave people with more agency, attention, and understanding than it found them?",
      coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1800&h=1000&fit=crop",
      accentColor: "#b45309",
      published: true,
      publishedAt: new Date(),
    },
  });
  if (!existingEdition || resetSeed) {
    await prisma.editionArticle.deleteMany({ where: { editionId: edition.id } });
    await prisma.editionArticle.createMany({
      data: articles.slice(0, 6).flatMap((article, index) => {
        const articleId = articleIdBySlug.get(article.slug);
        return articleId ? [{ editionId: edition.id, articleId, position: index + 1 }] : [];
      }),
    });
  }

  const marketplaceCreatorIds = new Map<string, string>();
  for (const creator of marketplaceCreators) {
    const record = await prisma.marketplaceCreator.upsert({
      where: { handle: creator.handle },
      update: { name: creator.name, initials: creator.initials, verified: creator.verified, bio: creator.bio, followers: creator.followers },
      create: { id: creator.id, name: creator.name, handle: creator.handle, initials: creator.initials, verified: creator.verified, bio: creator.bio, followers: creator.followers },
    });
    marketplaceCreatorIds.set(creator.handle, record.id);
  }

  const marketplaceCategoryIds = new Map<string, string>();
  for (const [position, name] of marketplaceCategoryNames.filter((item) => item !== "All").entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const record = await prisma.marketplaceCategory.upsert({
      where: { slug }, update: { name, position }, create: { name, slug, position },
    });
    marketplaceCategoryIds.set(name, record.id);
  }

  for (const product of marketplaceProducts) {
    const productDetails = product.slug === "conversion-copywriter" ? {
      purchaseCount: 3200, packageFileCount: 6, packageSizeBytes: 86_016,
      benefits: ["Extracts pains, desired outcomes, and objections from research", "Builds a claim-to-proof messaging map", "Drafts complete pages with voice constraints", "Reviews copy for unsupported claims and generic language"],
      useCases: [{ title: "New landing page", description: "Build a full argument from interviews and offer notes." }, { title: "Message refresh", description: "Find why existing copy sounds generic or unproven." }, { title: "Campaign variants", description: "Adapt the core argument without losing brand voice." }],
      includedFiles: [{ name: "SKILL.md", description: "Core workflow and behavioral instructions" }, { name: "README.md", description: "Setup, use, and troubleshooting" }, { name: "research-intake.md", description: "Structured customer-evidence intake" }, { name: "messaging-map.md", description: "Claim, proof, objection, and priority rubric" }, { name: "examples/", description: "Three annotated B2B and commerce examples" }, { name: "CHANGELOG.md", description: "Full version and migration history" }],
      exampleInput: "Product: incident review tool\nAudience: engineering leads\nEvidence: ‘We lose the thread between Slack and the postmortem.’",
      exampleOutputTitle: "Keep the incident story intact.", exampleOutputBody: "Turn scattered timelines, decisions, and follow-ups into one review your team can trust.",
      installationSteps: ["Download and unzip the package.", "Add the folder to your Claude Skills or Codex skills directory.", "Provide the research-intake template and ask the skill to build a messaging map.", "Review cited evidence before approving a draft."],
      previewFiles: ["SKILL.md", "README.md", "examples/saas.md", "rubrics/evidence.md"],
      previewExcerpt: "# Conversion Copywriter\n\nStart with evidence, not adjectives.\n\n1. Identify the audience's current situation.\n2. Extract exact phrases from supplied research.\n3. Map claims to available proof.\n4. Draft the argument before the headline.\n\nNever invent customer evidence.",
      requirements: "Skills support or file upload", permissions: "No network, account, or data access", license: "1 user · commercial use", updatesPolicy: "12 months included", refundPolicy: "14 days if not downloaded",
    } : { benefits: [], installationSteps: [], previewFiles: [] };
    await prisma.marketplaceProduct.upsert({
      where: { slug: product.slug }, update: {
        name: product.name, type: product.type, outcome: product.outcome, description: product.description,
        priceMinor: product.pricing.amount * 100, currency: product.pricing.currency, pricingModel: product.pricing.model,
        platforms: [...product.compatibility.platforms], models: [...product.compatibility.models], rating: product.rating,
        reviewCount: product.reviewCount, usageCount: product.usageCount, version: product.version,
        featured: product.featured ?? false, trending: product.trending ?? false, verified: product.verified, tags: product.tags,
        creatorId: marketplaceCreatorIds.get(product.creator.handle)!, categoryId: marketplaceCategoryIds.get(product.category)!,
        published: true, updatedAt: new Date(product.updatedAt), ...productDetails,
      }, create: {
        id: product.id, slug: product.slug, name: product.name, type: product.type, outcome: product.outcome,
        description: product.description, priceMinor: product.pricing.amount * 100, currency: product.pricing.currency,
        pricingModel: product.pricing.model, platforms: [...product.compatibility.platforms], models: [...product.compatibility.models],
        rating: product.rating, reviewCount: product.reviewCount, usageCount: product.usageCount, version: product.version,
        featured: product.featured ?? false, trending: product.trending ?? false, verified: product.verified, tags: product.tags,
        creatorId: marketplaceCreatorIds.get(product.creator.handle)!, categoryId: marketplaceCategoryIds.get(product.category)!,
        updatedAt: new Date(product.updatedAt), published: true, ...productDetails,
      },
    });
  }
  const detailProduct = await prisma.marketplaceProduct.findUniqueOrThrow({ where: { slug: "conversion-copywriter" } });
  for (const version of marketplaceVersions) {
    await prisma.marketplaceProductVersion.upsert({
      where: { productId_version: { productId: detailProduct.id, version: version.version } }, update: {},
      create: { productId: detailProduct.id, version: version.version, notes: version.notes, releasedAt: new Date(version.date) },
    });
  }
  for (const review of marketplaceReviews) {
    await prisma.marketplaceReview.upsert({
      where: { id: review.id }, update: {}, create: { id: review.id, productId: detailProduct.id, author: review.author, rating: review.rating, body: review.body, verifiedPurchase: review.verifiedPurchase, published: true, createdAt: new Date(review.date) },
    });
  }

  console.log(`Seeding complete. Created ${created} new articles and prepared ${marketplaceProducts.length} marketplace products.`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
