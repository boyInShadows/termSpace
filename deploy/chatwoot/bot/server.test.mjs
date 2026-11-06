import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { Queue } from "./queue.mjs";

async function until(check) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(25);
  }
  assert.fail("condition did not become true within 15 seconds");
}

async function fixture(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "termbuddy-test-"));
  const calls = { openai: [], chatwoot: [] };
  const controls = { openaiStatus: 200, chatwootStatus: 200, failOpenAIOnce: false, failChatwootOnce: false };
  const upstream = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const vendor = request.url === "/v1/responses" ? "openai" : "chatwoot";
    calls[vendor].push(body);
    const statusKey = vendor === "openai" ? "openaiStatus" : "chatwootStatus";
    const failKey = vendor === "openai" ? "failOpenAIOnce" : "failChatwootOnce";
    const status = controls[failKey] ? (vendor === "openai" ? 429 : 503) : controls[statusKey];
    controls[failKey] = false;
    response.writeHead(status, { "content-type": "application/json", "x-request-id": "test-correlation" });
    response.end(JSON.stringify(status >= 400 ? { error: "do not log this vendor body" } : vendor === "openai"
      ? { output: [{ type: "message", content: [{ type: "output_text", text: "Test answer" }] }] }
      : { id: calls.chatwoot.length }));
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  const baseUrl = `http://127.0.0.1:${upstream.address().port}`;
  let child;
  let botUrl;
  const logs = [];

  async function stop(signal = "SIGTERM") {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit");
    child.kill(signal);
    await exited;
  }

  t.after(async () => {
    await stop("SIGKILL");
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  async function start() {
    let output = "";
    child = spawn(process.execPath, [path.join(import.meta.dirname, "server.mjs")], {
      env: { ...process.env, PORT: "0", CHATWOOT_BASE_URL: baseUrl, CHATWOOT_ACCOUNT_ID: "1",
        CHATWOOT_BOT_TOKEN: "test-bot-token", WEBHOOK_SECRET: "test-secret", OPENAI_API_KEY: "test-key",
        OPENAI_BASE_URL: `${baseUrl}/v1`, STATE_DIRECTORY: directory, ...overrides },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (data) => {
      output += data;
      let newline;
      while ((newline = output.indexOf("\n")) >= 0) {
        const line = JSON.parse(output.slice(0, newline));
        output = output.slice(newline + 1);
        logs.push(line);
        if (line.event === "started") botUrl = `http://127.0.0.1:${line.port}`;
      }
    });
    let stderr = "";
    child.stderr.on("data", (data) => { stderr += data; });
    botUrl = undefined;
    await until(() => {
      if (child.exitCode !== null) assert.fail(`bot exited: ${stderr}`);
      return Boolean(botUrl);
    });
  }

  async function webhook(payload, { signed = true, timestamp = String(Math.floor(Date.now() / 1000)) } = {}) {
    const body = JSON.stringify(payload);
    const headers = { "content-type": "application/json" };
    if (signed) {
      headers["x-chatwoot-timestamp"] = timestamp;
      headers["x-chatwoot-signature"] = "sha256=" + crypto.createHmac("sha256", "test-secret")
        .update(`${timestamp}.${body}`).digest("hex");
    }
    return fetch(`${botUrl}/webhook`, { method: "POST", headers, body });
  }

  const health = () => fetch(`${botUrl}/health`);
  const record = (id) => JSON.parse(fs.readFileSync(path.join(directory, `${id}.json`), "utf8"));
  await start();
  return { calls, controls, logs, directory, start, stop, webhook, health, record };
}

const incoming = (id, content = "How can I publish?") => ({ event: "message_created", message_type: "incoming",
  private: false, account: { id: 1 }, id, conversation: { id: 10 }, content });

test("valid requests send history arrays, preserve follow-up context and deduplicate webhooks", async (t) => {
  const bot = await fixture(t);
  assert.equal((await bot.webhook(incoming(1))).status, 200);
  await until(() => bot.record(1).status === "done");
  assert.deepEqual(bot.calls.openai[0].input, [{ role: "user", content: "How can I publish?" }]);
  assert.equal(bot.calls.openai[0].store, false);
  assert.equal(bot.calls.openai[0].reasoning.effort, "none");
  assert.equal((await bot.webhook(incoming(2, "Is that free?"))).status, 200);
  await until(() => bot.record(2).status === "done");
  assert.deepEqual(bot.calls.openai[1].input.map((entry) => entry.role), ["user", "assistant", "user"]);
  await bot.webhook(incoming(2, "Is that free?"));
  await delay(100);
  assert.equal(bot.calls.openai.length, 2);
  assert.equal(bot.calls.chatwoot.length, 2);
  assert.equal((await bot.health()).status, 200);
  assert.ok(bot.logs.some((entry) => entry.event === "vendor_call" && entry.vendor === "openai" &&
    entry.status === 200 && entry.request_id === "test-correlation" && typeof entry.latency_ms === "number"));
  assert.doesNotMatch(JSON.stringify(bot.logs), /How can I publish|Test answer|test-key|test-bot-token/);
  assert.equal(bot.record(1).content, undefined);
  assert.equal(bot.record(1).answer, undefined);
});

test("rejects unsigned, stale, wrong-account and malformed message IDs; ignores private/outgoing messages", async (t) => {
  const bot = await fixture(t);
  assert.equal((await bot.webhook(incoming(1), { signed: false })).status, 401);
  assert.equal((await bot.webhook(incoming(1), { timestamp: "1" })).status, 401);
  assert.equal((await bot.webhook({ ...incoming(1), account: { id: 2 } })).status, 403);
  assert.equal((await bot.webhook(incoming("../escape"))).status, 400);
  assert.equal((await bot.webhook({ ...incoming(1), private: true })).status, 200);
  assert.equal((await bot.webhook({ ...incoming(1), message_type: "outgoing" })).status, 200);
  assert.equal(bot.calls.openai.length, 0);
});

test("retries OpenAI throttling and delivery failures without regenerating a saved answer", async (t) => {
  const bot = await fixture(t);
  bot.controls.failOpenAIOnce = true;
  bot.controls.failChatwootOnce = true;
  await bot.webhook(incoming(1));
  await until(() => bot.record(1).status === "done");
  assert.equal(bot.calls.openai.length, 2);
  assert.equal(bot.calls.chatwoot.length, 2);
  assert.deepEqual(bot.calls.chatwoot[0], bot.calls.chatwoot[1]);
  assert.equal((await bot.health()).status, 200);
});

test("resumes saved delivery after SIGKILL and retains deduplication across another restart", async (t) => {
  const bot = await fixture(t);
  bot.controls.chatwootStatus = 503;
  await bot.webhook(incoming(1));
  await until(() => bot.record(1).attempts >= 1);
  assert.equal((await bot.health()).status, 503);
  await bot.stop("SIGKILL");
  bot.controls.chatwootStatus = 200;
  await bot.start();
  await until(() => bot.record(1).status === "done");
  assert.equal(bot.calls.openai.length, 1);
  await bot.stop();
  await bot.start();
  await bot.webhook(incoming(1));
  await delay(100);
  assert.equal(bot.calls.chatwoot.length, 2);
});

test("permanent OpenAI failures send localized fallback and keep health degraded", async (t) => {
  const bot = await fixture(t);
  bot.controls.openaiStatus = 401;
  await bot.webhook(incoming(1));
  await until(() => bot.record(1).status === "done");
  await bot.webhook(incoming(2, "چطور منتشر کنم؟"));
  await until(() => bot.record(2).status === "done");
  assert.match(bot.calls.chatwoot[0].content, /technical issue/);
  assert.match(bot.calls.chatwoot[1].content, /مشکل فنی/);
  assert.equal(bot.calls.openai.length, 2);
  assert.equal((await bot.health()).status, 503);
  assert.doesNotMatch(JSON.stringify(bot.logs), /do not log this vendor body/);
});

test("signed outgoing webhook reconciles delivery when the HTTP acknowledgment is lost", async (t) => {
  const bot = await fixture(t);
  bot.controls.chatwootStatus = 503;
  await bot.webhook(incoming(1));
  await until(() => bot.record(1).attempts >= 1);
  await bot.webhook({ ...incoming(100, "Test answer"), message_type: "outgoing",
    content_attributes: { termbuddy_reply_to: 1 } });
  await until(() => bot.record(1).status === "done");
  await delay(1200);
  assert.equal(bot.calls.chatwoot.length, 1);
  assert.equal((await bot.health()).status, 200);
});

test("missing key exposes degraded health while preserving the fallback", async (t) => {
  const bot = await fixture(t, { OPENAI_API_KEY: "" });
  assert.equal((await bot.health()).status, 503);
  await bot.webhook(incoming(1));
  await until(() => bot.record(1).status === "done");
  assert.equal(bot.calls.openai.length, 0);
  assert.match(bot.calls.chatwoot[0].content, /technical issue/);
});

test("missing webhook secret fails startup before listening", async () => {
  const child = spawn(process.execPath, [path.join(import.meta.dirname, "server.mjs")], {
    env: { ...process.env, CHATWOOT_ACCOUNT_ID: "1", CHATWOOT_BOT_TOKEN: "test", WEBHOOK_SECRET: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let error = "";
  child.stderr.on("data", (data) => { error += data; });
  const [code] = await once(child, "exit");
  assert.notEqual(code, 0);
  assert.match(error, /missing_configuration:WEBHOOK_SECRET/);
});

test("queue persists before acknowledgment, preserves conversation order, and fails on unwritable storage", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "termbuddy-queue-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const queue = new Queue(directory);
  queue.accept({ id: 1, conversationId: 10, content: "one" });
  queue.update(1, { nextAt: Date.now() + 60000 });
  queue.accept({ id: 2, conversationId: 10, content: "two" });
  queue.accept({ id: 3, conversationId: 20, content: "three" });
  assert.equal(queue.next().id, 3);
  assert.equal(new Queue(directory).stats().pending, 3);
  assert.equal(queue.accept({ id: 1, conversationId: 10, content: "duplicate" }), false);
  fs.renameSync(directory, directory + "-moved");
  try {
    assert.throws(() => queue.accept({ id: 4, conversationId: 10, content: "must not acknowledge" }), /ENOENT/);
    assert.equal(queue.jobs.has(4), false);
  } finally {
    fs.renameSync(directory + "-moved", directory);
  }
});
