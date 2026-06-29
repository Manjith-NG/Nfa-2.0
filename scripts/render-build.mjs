/**
 * Render.com build: Prisma client + DB setup + Next.js production build
 */
import { spawnSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveDatabaseEnv } from "./resolve-database-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "prisma", "schema.prisma");
const uploadsDir = resolve(root, "uploads");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!existsSync(schemaPath)) {
  console.error(`[render-build] Missing ${schemaPath}`);
  process.exit(1);
}

if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

console.log("\n[render-build] Resolving database environment...");
const dbOk = await resolveDatabaseEnv({ required: true });
if (!dbOk) {
  console.error(
    "[render-build] Add SUPABASE_DB_PASSWORD (or DATABASE_URL + DIRECT_URL) in Render → Environment, then redeploy."
  );
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
const looksLikePooler =
  dbUrl.includes("pooler") || dbUrl.includes(":6543") || dbUrl.includes("pgbouncer=true");

if (!process.env.DIRECT_URL && looksLikePooler) {
  console.error("[render-build] DIRECT_URL is required when using the Supabase pooler.");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
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
