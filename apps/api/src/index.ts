import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT ?? 4001);

async function main() {
  // The compose file only checks that the database password is non-empty.
  if (process.env.NODE_ENV === "production" && /change-this|replace-with/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("DATABASE_URL still contains a .env.example placeholder");
  }
  const app = createApp();

  // Verify the database connection before serving.
  await prisma.$connect();
  console.log("Connected to PostgreSQL");

  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down...`);
    const forceExit = setTimeout(() => {
      console.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
    clearTimeout(forceExit);
    console.log("Shutting down...");
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
