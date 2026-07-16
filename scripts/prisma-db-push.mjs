/**
 * Load .env and ensure DIRECT_URL is set for Prisma CLI (db push / migrate).
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

function loadEnvFile() {
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace(":6543", ":5432");
}

if (!process.env.DATABASE_URL) {
  console.error("[prisma-db-push] DATABASE_URL is not set. Run: npm run setup:env YOUR_DB_PASSWORD");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error("[prisma-db-push] DIRECT_URL is not set and could not be derived from DATABASE_URL.");
  process.exit(1);
}

const args = process.argv.slice(2);
const prismaArgs = args.length > 0 ? args : ["db", "push", "--schema=./prisma/schema.prisma"];

const result = spawnSync("npx", ["prisma", ...prismaArgs], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
