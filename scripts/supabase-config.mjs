/** Shared Supabase project config for Node scripts */
export const SUPABASE_PROJECT_REF = "uuqzhbzovurnlbiuazgh";
export const SUPABASE_URL = "https://uuqzhbzovurnlbiuazgh.supabase.co";

export const POOLER_HOSTS = [
  "aws-1-ap-northeast-1.pooler.supabase.com",
  "aws-0-ap-northeast-1.pooler.supabase.com",
  "aws-0-ap-south-1.pooler.supabase.com",
  "aws-1-ap-south-1.pooler.supabase.com",
  "aws-0-ap-southeast-1.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
  "aws-0-eu-west-1.pooler.supabase.com",
];

export const NFA_APP_DB_USER = "nfa_app_login";

export function buildDirectUrl(password) {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?connect_timeout=30`;
}

export function buildPoolerUrl(password, host, port = 6543) {
  const encoded = encodeURIComponent(password);
  const query = port === 6543 ? "?pgbouncer=true&connect_timeout=30" : "?connect_timeout=30";
  return `postgresql://postgres.${SUPABASE_PROJECT_REF}:${encoded}@${host}:${port}/postgres${query}`;
}

export function buildEnvContent({ databaseUrl, directUrl, anonKey }) {
  return `# NFA Supabase (project: ${SUPABASE_PROJECT_REF})
DATABASE_URL="${databaseUrl}"
DIRECT_URL="${directUrl}"

NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey ?? "YOUR_SUPABASE_ANON_KEY"}"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="nfa-dev-secret-change-in-production-32chars"
UPLOAD_DIR="./uploads"
`;
}
