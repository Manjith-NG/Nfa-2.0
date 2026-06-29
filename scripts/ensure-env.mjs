import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { stdin as input, stdout as output } from "process";
import { PrismaClient } from "@prisma/client";
import {
  SUPABASE_PROJECT_REF,
  POOLER_HOSTS,
  buildDirectUrl,
  buildPoolerUrl,
  buildEnvContent,
} from "./supabase-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");

async function testUrl(url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function findWorkingUrls(password) {
  const direct = buildDirectUrl(password);
  if (await testUrl(direct)) {
    for (const host of POOLER_HOSTS) {
      for (const port of [6543, 5432]) {
        const pooler = buildPoolerUrl(password, host, port);
        if (await testUrl(pooler)) {
          return { database: pooler, direct };
        }
      }
    }
    return { database: direct, direct };
  }
  return null;
}

function envNeedsSetup(content) {
  if (!content) return true;
  if (content.includes("YOUR_DB_PASSWORD")) return true;
  if (content.includes("REPLACE_ME")) return true;
  if (!content.includes(SUPABASE_PROJECT_REF)) return true;
  return false;
}

function promptPassword() {
  return new Promise((resolvePrompt) => {
    const rl = createInterface({ input, output });
    console.log(`
NFA – Supabase setup (one-time)
Project: ${SUPABASE_PROJECT_REF}
Get password: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/database
`);
    rl.question("Paste Supabase DATABASE password: ", (answer) => {
      rl.close();
      resolvePrompt(answer.trim());
    });
  });
}

function readAnonKey(content) {
  const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/);
  return match?.[1];
}

let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const cliPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;

if (!envNeedsSetup(content) && !cliPassword) {
  process.exit(0);
}

const password = cliPassword || (await promptPassword());
if (!password) {
  console.error("No password provided.");
  process.exit(1);
}

const urls = await findWorkingUrls(password);
if (!urls) {
  console.error(`
Connection failed. Use the password from:
  Supabase Dashboard → Project Settings → Database → Database password

Do NOT use your Supabase account login password.
`);
  process.exit(1);
}

const anonKey = readAnonKey(content) ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
writeFileSync(
  envPath,
  buildEnvContent({ ...urls, anonKey }),
  "utf8"
);
console.log("✅ .env saved with working Supabase connection.\n");
