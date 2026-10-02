import { createHash } from "node:crypto";
import request from "supertest";
import { afterAll, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const url = process.env.EDITORIAL_TEST_DATABASE_URL;
const db = new PrismaClient({ datasources: { db: { url: url ?? process.env.DATABASE_URL } } });
afterAll(() => db.$disconnect());

it.skipIf(!url)("keeps editorial workflows staff-only and preserves comment and subscriber state", async () => {
  const parsed = new URL(url!);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) || !parsed.pathname.startsWith("/termspace_batch_")) throw new Error("Use a disposable local batch database");
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = "test";
  process.env.CORS_ORIGINS = "http://localhost:3001";
  const { createApp } = await import("./app.js");
  const app = createApp();
  const token = "editorial-session-token-abcdefghijklmnopqrstuvwxyz";
  const admin = await db.adminUser.create({ data: { email: "editor@batch.test", passwordHash: "unused" } });
  await db.adminSession.create({ data: { userId: admin.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 600_000) } });
  const cookie = `term_academy_session=${token}`;
  const write = (path: string) => request(app).post(path).set("Origin", "http://localhost:3001").set("Cookie", cookie);
  const author = await db.author.create({ data: { name: "Editor" } });
  const category = await db.category.create({ data: { name: "Engineering", slug: "engineering" } });
  const article = await db.article.create({ data: { title: "Editorial test", slug: "editorial-test", content: "A published editorial test article.", published: true, publishedAt: new Date(), authorId: author.id, categoryId: category.id } });
  expect((await write("/api/articles").send({ title: "Long signal", slug: "long-signal", kind: "SIGNAL", content: "x".repeat(1201), authorId: author.id, categoryId: category.id })).status).toBe(400);
  const signal = await write("/api/articles").send({ title: "Short signal", slug: "short-signal", kind: "SIGNAL", content: "A concise editorial observation.", authorId: author.id, categoryId: category.id, published: true });
  expect(signal.status).toBe(201);
  expect((await request(app).put(`/api/articles/${signal.body.data.id}`).set("Origin", "http://localhost:3001").set("Cookie", cookie).send({ content: "x".repeat(1201) })).status).toBe(400);
  expect((await request(app).get("/api/articles?published=true&kind=SIGNAL")).body.data.map((item: { slug: string }) => item.slug)).toContain("short-signal");

  expect((await request(app).get("/api/newsletter/admin/campaigns")).status).toBe(401);
  expect((await request(app).get("/api/newsletter/admin/subscribers/export")).status).toBe(401);
  expect((await request(app).post("/api/newsletter/subscribers").send({ email: "reader@batch.test" })).status).toBe(202);
  const subscriber = await db.newsletterSubscriber.findUniqueOrThrow({ where: { email: "reader@batch.test" } });
  const exported = await request(app).get("/api/newsletter/admin/subscribers/export").set("Cookie", cookie);
  expect(exported.text).toContain("reader@batch.test");
  expect(exported.text).not.toContain(subscriber.unsubscribeToken);

  const created = await write("/api/newsletter/admin/campaigns").send({ articleId: article.id });
  expect(created.status).toBe(201);
  expect(created.body.data.subject).toBe(article.title);
  const campaignId = created.body.data.id as string;
  expect((await write(`/api/newsletter/admin/campaigns/${campaignId}/send`).send({})).body.data.queued).toBe(1);
  expect((await write(`/api/newsletter/admin/campaigns/${campaignId}/send`).send({})).status).toBe(409);
  expect((await request(app).post("/api/newsletter/unsubscribe").send({ token: subscriber.unsubscribeToken })).status).toBe(202);
  expect((await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: subscriber.id } })).active).toBe(false);
  expect((await request(app).post("/api/newsletter/subscribers").send({ email: "reader@batch.test" })).status).toBe(202);
  expect((await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: subscriber.id } })).active).toBe(false);

  const parent = await db.comment.create({ data: { articleId: article.id, name: "Parent", email: "parent@batch.test", body: "A first perspective", approved: true, approvedAt: new Date() } });
  expect((await request(app).post("/api/articles/editorial-test/comments").send({ name: "Reader", email: "reader@batch.test", body: "A reply", parentId: "unknown" })).status).toBe(400);
  expect((await request(app).post("/api/articles/editorial-test/comments").send({ name: "Reader", email: "reader@batch.test", body: "A reply", parentId: parent.id })).status).toBe(202);
  const reply = await db.comment.findFirstOrThrow({ where: { parentId: parent.id } });
  expect((await request(app).put(`/api/comments/${reply.id}/curated`).set("Origin", "http://localhost:3001").set("Cookie", cookie).send({ curated: true })).status).toBe(409);
  expect((await request(app).put(`/api/comments/${reply.id}/approve`).set("Origin", "http://localhost:3001").set("Cookie", cookie).send({})).status).toBe(200);
  expect((await request(app).put(`/api/comments/${reply.id}/curated`).set("Origin", "http://localhost:3001").set("Cookie", cookie).send({ curated: true })).status).toBe(200);
  const publicComments = await request(app).get("/api/comments?article=editorial-test");
  expect(publicComments.body.data).toContainEqual(expect.objectContaining({ id: reply.id, parentId: parent.id, curated: true }));
  expect(JSON.stringify(publicComments.body)).not.toContain("reader@batch.test");

  const series = await db.series.create({ data: { name: "Living subject", slug: "living-subject", dossierContent: "## Private draft", dossierPublished: false } });
  expect((await request(app).get("/api/series/living-subject")).body.data.dossierContent).toBeNull();
  expect((await request(app).get("/api/series/living-subject").set("Cookie", cookie)).body.data.dossierContent).toBe("## Private draft");
  expect((await request(app).put(`/api/series/${series.id}`).set("Origin", "http://localhost:3001").set("Cookie", cookie).send({ dossierPublished: true })).status).toBe(200);
  expect((await request(app).get("/api/series?dossiers=true")).body.data).toContainEqual(expect.objectContaining({ id: series.id, dossierPublished: true }));
});
