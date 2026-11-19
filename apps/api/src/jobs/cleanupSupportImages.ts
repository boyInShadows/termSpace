import "dotenv/config";
import { cleanupUnreferencedSupportImages } from "../lib/supportImageCleanup.js";
import { prisma } from "../lib/prisma.js";

try { console.log(`Removed ${await cleanupUnreferencedSupportImages()} unreferenced private support images`); }
catch (error) { console.error("Private support cleanup failed", error instanceof Error ? error.name : "UnknownError"); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
