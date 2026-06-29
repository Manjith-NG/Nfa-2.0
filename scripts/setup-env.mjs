import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import {
  POOLER_HOSTS,
  buildDirectUrl,
  buildPoolerUrl,
  buildEnvContent,
} from "./supabase-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Usage: node scripts/setup-env.mjs YOUR_SUPABASE_DATABASE_PASSWORD");
  process.exit(1);
}

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

let database = null;
let direct = buildDirectUrl(password);

if (await testUrl(direct)) {
  for (const host of POOLER_HOSTS) {
    for (const port of [6543, 5432]) {
      const pooler = buildPoolerUrl(password, host, port);
      if (await testUrl(pooler)) {
        database = pooler;
        break;
      }
    }
    if (database) break;
  }
  if (!database) database = direct;
} else {
  for (const host of POOLER_HOSTS) {
    const pooler6543 = buildPoolerUrl(password, host, 6543);
    const pooler5432 = buildPoolerUrl(password, host, 5432);
    if (await testUrl(pooler6543)) {
      database = pooler6543;
      direct = (await testUrl(pooler5432)) ? pooler5432 : pooler6543;
      break;
    }
    if (await testUrl(pooler5432)) {
      database = pooler5432;
      direct = pooler5432;
      break;
    }
  }
}

if (!database) {
  console.error("❌ Connection failed — check database password in Supabase Dashboard → Settings → Database");
  process.exit(1);
}
console.log("✅ Connection test passed");

writeFileSync(
  resolve(root, ".env"),
  buildEnvContent({
    databaseUrl: database,
    directUrl: direct,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }),
  "utf8"
);
console.log("✅ Wrote .env — run: npm run db:push && npm run db:seed && npm run dev");
