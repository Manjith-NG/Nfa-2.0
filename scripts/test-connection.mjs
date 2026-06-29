import { PrismaClient } from "@prisma/client";
import { POOLER_HOSTS, buildDirectUrl, buildPoolerUrl, SUPABASE_PROJECT_REF } from "./supabase-config.mjs";

const password = encodeURIComponent(process.argv[2] || "");
if (!password) {
  console.error("Usage: node scripts/test-connection.mjs YOUR_DATABASE_PASSWORD");
  process.exit(1);
}

const direct = buildDirectUrl(process.argv[2]);
const prismaDirect = new PrismaClient({ datasources: { db: { url: direct } } });
try {
  await prismaDirect.$queryRaw`SELECT 1`;
  console.log(`SUCCESS direct db.${SUPABASE_PROJECT_REF}.supabase.co:5432`);
  console.log(`DIRECT_URL="${direct}"`);
} catch (e) {
  console.log(`fail direct → ${(e.message || "").replace(/\n/g, " ").slice(0, 120)}`);
} finally {
  await prismaDirect.$disconnect();
}

for (const host of POOLER_HOSTS) {
  for (const port of [6543, 5432]) {
    const url = buildPoolerUrl(process.argv[2], host, port);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`SUCCESS host=${host} port=${port}`);
      console.log(`DATABASE_URL="${url}"`);
      await prisma.$disconnect();
      process.exit(0);
    } catch (e) {
      const msg = (e.message || "").replace(/\n/g, " ").slice(0, 100);
      console.log(`fail ${host}:${port} → ${msg}`);
      await prisma.$disconnect();
    }
  }
}
process.exit(1);
