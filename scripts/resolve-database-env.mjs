/**
 * Ensures DATABASE_URL + DIRECT_URL are set (Render / production).
 * Prisma must use Supabase transaction pooler (port 6543), not session pooler (5432).
 */
import { PrismaClient } from "@prisma/client";
import {
  SUPABASE_PROJECT_REF,
  POOLER_HOSTS,
  NFA_APP_DB_USER,
} from "./supabase-config.mjs";

const RUNTIME_POOL_PORT = 6543;

function isConfiguredUrl(url) {
  return (
    typeof url === "string" &&
    url.startsWith("postgresql") &&
    url.length > 20 &&
    !url.includes("YOUR_DB_PASSWORD") &&
    !url.includes("REPLACE_ME")
  );
}

function isSessionPoolerUrl(url) {
  return url.includes(".pooler.supabase.com:5432");
}

function isDirectDbUrl(url) {
  return url.includes(`db.${SUPABASE_PROJECT_REF}.supabase.co`);
}

/**
 * Prisma + Supabase: use transaction pooler (6543) with pgbouncer=true and a low connection_limit.
 */
export function normalizeRuntimeDatabaseUrl(url) {
  let normalized = url;

  if (isSessionPoolerUrl(normalized)) {
    normalized = normalized.replace(
      ".pooler.supabase.com:5432",
      `.pooler.supabase.com:${RUNTIME_POOL_PORT}`
    );
  }

  if (normalized.includes(".pooler.supabase.com") && !normalized.includes("pgbouncer=true")) {
    normalized += normalized.includes("?") ? "&" : "?";
    normalized += "pgbouncer=true";
  }

  if (!normalized.includes("connection_limit=")) {
    normalized += normalized.includes("?") ? "&" : "?";
    normalized += "connection_limit=1";
  }

  if (!normalized.includes("pool_timeout=")) {
    normalized += "&pool_timeout=20";
  }

  return normalized;
}

function buildDirectUrlForUser(password, user = "postgres") {
  const encoded = encodeURIComponent(password);
  if (user === "postgres") {
    return `postgresql://postgres:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=30`;
  }
  return `postgresql://${user}:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=30`;
}

function buildTransactionPoolerUrl(password, host, user = "postgres") {
  const encoded = encodeURIComponent(password);
  const query = "?pgbouncer=true&connect_timeout=30&connection_limit=1&pool_timeout=20";
  if (user === "postgres") {
    return `postgresql://postgres.${SUPABASE_PROJECT_REF}:${encoded}@${host}:${RUNTIME_POOL_PORT}/postgres${query}`;
  }
  return `postgresql://${user}.${SUPABASE_PROJECT_REF}:${encoded}@${host}:${RUNTIME_POOL_PORT}/postgres${query}`;
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

async function discoverUrls(password) {
  const users = ["postgres", NFA_APP_DB_USER];

  for (const user of users) {
    const direct = buildDirectUrlForUser(password, user);
    if (!(await testUrl(direct))) continue;

    for (const host of POOLER_HOSTS) {
      const pooler = buildTransactionPoolerUrl(password, host, user);
      if (await testUrl(pooler)) {
        return { database: pooler, direct };
      }
    }

    return {
      database: normalizeRuntimeDatabaseUrl(direct),
      direct,
    };
  }

  for (const user of users) {
    for (const host of POOLER_HOSTS) {
      const pooler = buildTransactionPoolerUrl(password, host, user);
      if (await testUrl(pooler)) {
        const direct = buildDirectUrlForUser(password, user);
        const directOk = await testUrl(direct);
        return {
          database: pooler,
          direct: directOk ? direct : pooler,
        };
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
    process.env.DATABASE_URL = normalizeRuntimeDatabaseUrl(process.env.DATABASE_URL);

    if (!isConfiguredUrl(process.env.DIRECT_URL)) {
      if (isDirectDbUrl(process.env.DATABASE_URL)) {
        process.env.DIRECT_URL = process.env.DATABASE_URL;
      } else {
        console.warn(
          "[resolve-database-env] DIRECT_URL missing — set direct db URL for migrations."
        );
      }
    } else if (isSessionPoolerUrl(process.env.DIRECT_URL)) {
      console.warn("[resolve-database-env] DIRECT_URL should use db.*.supabase.co:5432, not session pooler.");
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
      "[resolve-database-env] Could not connect to Supabase. Check SUPABASE_DB_PASSWORD in Render."
    );
    return false;
  }

  process.env.DATABASE_URL = urls.database;
  process.env.DIRECT_URL = urls.direct;
  console.log("[resolve-database-env] Using transaction pooler (port 6543) for DATABASE_URL.");
  return true;
}
