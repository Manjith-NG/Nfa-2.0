/**
 * Render.com build: Prisma client + DB setup + Next.js production build
 */
import { spawnSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "prisma", "schema.prisma");
const dataDir = resolve(root, "data");
const uploadsDir = resolve(root, "uploads");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!existsSync(schemaPath)) {
  console.error(`[render-build] Missing ${schemaPath}`);
  console.error("[render-build] Commit prisma/schema.prisma before deploying.");
  process.exit(1);
}

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

if (!process.env.DATABASE_URL) {
  console.error("[render-build] DATABASE_URL is required (Supabase PostgreSQL pooler URL).");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
const looksLikePooler =
  dbUrl.includes("pooler") || dbUrl.includes(":6543") || dbUrl.includes("pgbouncer=true");

if (!process.env.DIRECT_URL) {
  if (looksLikePooler) {
    console.error("[render-build] DIRECT_URL is required when DATABASE_URL uses Supabase pooler.");
    console.error("[render-build] Set DIRECT_URL to the direct db host on port 5432 (see .env.example).");
    process.exit(1);
  }
  console.warn("[render-build] DIRECT_URL not set — using DATABASE_URL for migrations.");
  process.env.DIRECT_URL = dbUrl;
}

console.log("\n[render-build] Prisma generate...");
run("node", ["scripts/prisma-generate.mjs"]);

console.log("\n[render-build] Prisma db push...");
run("npx", ["prisma", "db", "push", "--schema=./prisma/schema.prisma", "--accept-data-loss"]);

console.log("\n[render-build] Seed database...");
run("npx", ["tsx", "prisma/seed.ts"]);

console.log("\n[render-build] Next.js build...");
run("npm", ["run", "build"]);

console.log("\n[render-build] Done.\n");
