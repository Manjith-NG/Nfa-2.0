/** Supabase project configuration (NFA) */
export const SUPABASE_PROJECT_REF = "uuqzhbzovurnlbiuazgh";
export const SUPABASE_URL = "https://uuqzhbzovurnlbiuazgh.supabase.co";
/** Session pooler — primary region for project uuqzhbzovurnlbiuazgh */
export const SUPABASE_POOLER_HOST = "aws-1-ap-northeast-1.pooler.supabase.com";

export function buildSupabaseDatabaseUrl(password: string): string {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${SUPABASE_PROJECT_REF}:${encoded}@${SUPABASE_POOLER_HOST}:6543/postgres?pgbouncer=true&connect_timeout=30`;
}

export function buildSupabaseDirectUrl(password: string): string {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=30`;
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return (
    url.length > 10 &&
    url.startsWith("postgresql") &&
    !url.includes("YOUR_DB_PASSWORD") &&
    !url.includes("REPLACE_ME")
  );
}

export function buildEnvFileContent(dbPassword: string): string {
  const databaseUrl = buildSupabaseDatabaseUrl(dbPassword);
  const directUrl = buildSupabaseDirectUrl(dbPassword);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "YOUR_SUPABASE_ANON_KEY";
  return `# NFA Supabase (project: ${SUPABASE_PROJECT_REF})
DATABASE_URL="${databaseUrl}"
DIRECT_URL="${directUrl}"

NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey}"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET ?? "nfa-dev-secret-change-in-production-32chars"}"
UPLOAD_DIR="./uploads"
`;
}
