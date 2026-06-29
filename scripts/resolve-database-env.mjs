/**
 * Ensures DATABASE_URL + DIRECT_URL are set (Render / production).
 * Set SUPABASE_DB_PASSWORD in Render if full URLs are not configured.
 */
import { PrismaClient } from "@prisma/client";
import {
  SUPABASE_PROJECT_REF,
  POOLER_HOSTS,
  NFA_APP_DB_USER,
  buildDirectUrl,
  buildPoolerUrl,
} from "./supabase-config.mjs";

function isConfiguredUrl(url) {
  return (
    typeof url === "string" &&
    url.startsWith("postgresql") &&
    url.length > 20 &&
    !url.includes("YOUR_DB_PASSWORD") &&
    !url.includes("REPLACE_ME")
  );
}

function looksLikePooler(url) {
  return url.includes("pooler") || url.includes(":6543") || url.includes("pgbouncer=true");
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

function buildDirectUrlForUser(password, user = "postgres") {
  const encoded = encodeURIComponent(password);
  if (user === "postgres") {
    return `postgresql://postgres:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=30`;
  }
  return `postgresql://${user}:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=30`;
}

function buildPoolerUrlForUser(password, host, port, user = "postgres") {
  const encoded = encodeURIComponent(password);
  const query = port === 6543 ? "?pgbouncer=true&connect_timeout=30" : "?connect_timeout=30";
  if (user === "postgres") {
    return `postgresql://postgres.${SUPABASE_PROJECT_REF}:${encoded}@${host}:${port}/postgres${query}`;
  }
  return `postgresql://${user}.${SUPABASE_PROJECT_REF}:${encoded}@${host}:${port}/postgres${query}`;
}

async function discoverUrls(password) {
  const users = ["postgres", NFA_APP_DB_USER];

  for (const user of users) {
    const direct = buildDirectUrlForUser(password, user);
    if (await testUrl(direct)) {
      for (const host of POOLER_HOSTS) {
        for (const port of [6543, 5432]) {
          const pooler = buildPoolerUrlForUser(password, host, port, user);
          if (await testUrl(pooler)) {
            return { database: pooler, direct };
          }
        }
      }
      return { database: direct, direct };
    }
  }

  for (const user of users) {
    for (const host of POOLER_HOSTS) {
      for (const port of [6543, 5432]) {
        const pooler = buildPoolerUrlForUser(password, host, port, user);
        if (await testUrl(pooler)) {
          const direct = buildDirectUrlForUser(password, user);
          const directOk = await testUrl(direct);
          return { database: pooler, direct: directOk ? direct : pooler };
        }
      }
    }
  }

  return null;
}

/**
 * @param {{ required?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export async function resolveDatabaseEnv(options = {}) {
  const { required = false } = options;

  if (isConfiguredUrl(process.env.DATABASE_URL)) {
    if (!isConfiguredUrl(process.env.DIRECT_URL)) {
      if (looksLikePooler(process.env.DATABASE_URL)) {
        console.warn(
          "[resolve-database-env] DIRECT_URL missing — migrations may fail; set DIRECT_URL in Render."
        );
      } else {
        process.env.DIRECT_URL = process.env.DATABASE_URL;
      }
    }
    return true;
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    const message =
      "[resolve-database-env] Set DATABASE_URL + DIRECT_URL, or SUPABASE_DB_PASSWORD, in Render → Environment.";
    if (required) {
      console.error(message);
      return false;
    }
    console.warn(message);
    return false;
  }

  console.log("[resolve-database-env] Discovering Supabase connection from SUPABASE_DB_PASSWORD...");
  const urls = await discoverUrls(password);
  if (!urls) {
    console.error(
      "[resolve-database-env] Could not connect to Supabase. Check SUPABASE_DB_PASSWORD in Render (Database password, not account login)."
    );
    return false;
  }

  process.env.DATABASE_URL = urls.database;
  process.env.DIRECT_URL = urls.direct;
  console.log("[resolve-database-env] DATABASE_URL configured.");
  return true;
}
