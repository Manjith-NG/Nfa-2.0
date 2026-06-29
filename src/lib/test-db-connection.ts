import { PrismaClient } from "@prisma/client";
import { buildSupabaseDatabaseUrl } from "./env";

/** Test Supabase credentials before saving .env */
export async function testDatabaseConnection(
  dbPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = buildSupabaseDatabaseUrl(dbPassword);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Authentication failed")) {
      return {
        ok: false,
        error:
          "Wrong database password. Copy the exact password from Supabase Dashboard → Settings → Database.",
      };
    }
    if (msg.includes("Can't reach") || msg.includes("ENOTFOUND")) {
      return {
        ok: false,
        error: "Cannot reach Supabase. Check your internet connection.",
      };
    }
    return { ok: false, error: msg.split("\n")[0] };
  } finally {
    await prisma.$disconnect();
  }
}
