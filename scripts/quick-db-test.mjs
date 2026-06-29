import { PrismaClient } from "@prisma/client";
import { SUPABASE_PROJECT_REF, POOLER_HOSTS } from "./supabase-config.mjs";

const password = process.argv[2];
const user = process.argv[3] || "postgres";
if (!password) {
  console.error("Usage: node scripts/quick-db-test.mjs PASSWORD [USER]");
  process.exit(1);
}

const encoded = encodeURIComponent(password);
const urls = [
  `postgresql://${user}:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=15`,
  ...POOLER_HOSTS.flatMap((host) => [
    `postgresql://${user}.${SUPABASE_PROJECT_REF}:${encoded}@${host}:5432/postgres?connect_timeout=15`,
    `postgresql://${user}.${SUPABASE_PROJECT_REF}:${encoded}@${host}:6543/postgres?pgbouncer=true&connect_timeout=15`,
  ]),
];

for (const url of urls) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("OK", url.replace(/:([^:@/]+)@/, ":***@"));
    process.exit(0);
  } catch (e) {
    const msg = (e.message || "").replace(/\s+/g, " ").slice(0, 90);
    if (!msg.includes("Timed out") && !msg.includes("ENOTFOUND")) {
      console.log("fail", msg);
    }
  } finally {
    await prisma.$disconnect();
  }
}

process.exit(1);
