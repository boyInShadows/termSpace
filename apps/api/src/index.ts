import "dotenv/config";
import { createApp } from "./app.js";
import { assertProductionConfig } from "./lib/productionConfig.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT ?? 4001);

// Crash on a stray rejection or exception instead of limping on in an unknown state;
// the container restarts the API. Log the message only, never request data.
for (const event of ["unhandledRejection", "uncaughtException"] as const) {
  process.on(event, (reason) => {
    console.error(`${event}:`, reason instanceof Error ? reason.stack : reason);
    process.exit(1);
  });
}

async function main() {
  assertProductionConfig();
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
