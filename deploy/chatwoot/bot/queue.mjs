import fs from "node:fs";
import path from "node:path";

const DONE_TTL_MS = 24 * 60 * 60 * 1000;

// ponytail: one process owns this directory; use a database queue before scaling
// the bot to multiple replicas. Pending text is removed as soon as delivery succeeds.
export class Queue {
  constructor(directory) {
    this.directory = directory;
    this.jobs = new Map();
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    for (const file of fs.readdirSync(directory)) {
      if (!/^\d+\.json$/.test(file)) continue;
      const job = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
      if (String(job.id) + ".json" !== file || !["pending", "done"].includes(job.status)) {
        throw new Error("invalid_queue_record");
      }
      this.jobs.set(job.id, job);
    }
    this.prune();
  }

  save(job) {
    const file = path.join(this.directory, `${job.id}.json`);
    const temporary = `${file}.tmp`;
    const descriptor = fs.openSync(temporary, "w", 0o600);
    try {
      fs.writeFileSync(descriptor, JSON.stringify(job));
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.renameSync(temporary, file);
    const directory = fs.openSync(this.directory, "r");
    try {
      fs.fsyncSync(directory);
    } finally {
      fs.closeSync(directory);
    }
    this.jobs.set(job.id, job);
  }

  accept({ id, conversationId, content }) {
    if (this.jobs.has(id)) return false;
    if (this.stats().pending >= 1000) throw new Error("queue_full");
    this.save({ id, conversationId, content, status: "pending", createdAt: Date.now(), attempts: 0, nextAt: 0 });
    return true;
  }

  update(id, fields) {
    const job = this.jobs.get(id);
    if (job?.status === "pending") this.save({ ...job, ...fields });
  }

  complete(id) {
    const job = this.jobs.get(id);
    if (job?.status !== "pending") return;
    this.save({ id, conversationId: job.conversationId, status: "done", completedAt: Date.now() });
  }

  next() {
    const blocked = new Set();
    const jobs = [...this.jobs.values()].filter((job) => job.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
    for (const job of jobs) {
      if (blocked.has(job.conversationId)) continue;
      blocked.add(job.conversationId);
      if (job.nextAt <= Date.now()) return job;
    }
  }

  stats() {
    const jobs = [...this.jobs.values()].filter((job) => job.status === "pending");
    return { pending: jobs.length, oldest_age_ms: jobs.length ? Date.now() - Math.min(...jobs.map((job) => job.createdAt)) : 0 };
  }

  prune() {
    for (const [id, job] of this.jobs) {
      if (job.status === "done" && Date.now() - job.completedAt > DONE_TTL_MS) {
        fs.unlinkSync(path.join(this.directory, `${id}.json`));
        this.jobs.delete(id);
      }
    }
  }
}
