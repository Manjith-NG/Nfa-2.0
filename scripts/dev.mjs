/**
 * Starts Next.js on a fixed port and syncs NEXTAUTH_URL (fixes login when port 3000 is busy).
 */
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { SUPABASE_PROJECT_REF } from "./supabase-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");
const PORT = process.env.PORT || "3000";
const baseUrl = `http://localhost:${PORT}`;

const SETUP_HINT = `
╔══════════════════════════════════════════════════════════════╗
║  DATABASE NOT CONFIGURED — login will not work until fixed   ║
╚══════════════════════════════════════════════════════════════╝

  Your .env must use PostgreSQL (Supabase), not SQLite.

  1. Get your database password:
     https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/database

  2. Run (replace with your password):
     npm run setup:env YOUR_SUPABASE_DATABASE_PASSWORD

  3. Seed demo users:
     npm run db:seed

  4. Start again:
     npm run dev

  Demo login after seed: faculty.cse@gcu.edu.in / FAC001 (Faculty ID)
`;

function hasValidDatabaseUrl(content) {
  const match = content.match(/^DATABASE_URL=(.+)$/m);
  if (!match) return false;
  const value = match[1].replace(/^["']|["']$/g, "");
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

function syncEnv() {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  if (!hasValidDatabaseUrl(content)) {
    console.error(SETUP_HINT);
    if (!existsSync(envPath)) {
      writeFileSync(
        envPath,
        `# Configure Supabase — run: npm run setup:env YOUR_DATABASE_PASSWORD
NEXTAUTH_SECRET="nfa-dev-secret-change-in-production-32chars"
UPLOAD_DIR="./uploads"
NEXTAUTH_URL="${baseUrl}"
`,
        "utf8"
      );
    }
    process.exit(1);
  }

  if (/^NEXTAUTH_URL=/m.test(content)) {
    content = content.replace(/^NEXTAUTH_URL=.*$/m, `NEXTAUTH_URL="${baseUrl}"`);
  } else {
    content += `\nNEXTAUTH_URL="${baseUrl}"\n`;
  }
  writeFileSync(envPath, content, "utf8");
}

syncEnv();

console.log(`
╔════════════════════════════════════════╗
║  NFA 2.0 – Note For Approval System    ║
╚════════════════════════════════════════╝

  Open: ${baseUrl}/login
  (Use this exact URL — avoid the Network IP for sign-in)

  Faculty login:
    Email:    faculty.cse@gcu.edu.in
    Password: FAC001  (Faculty ID)

  Developer:
    Email:    developer@gcu.edu.in
    Password: DEV001

  First time? Run: npm run setup:env YOUR_DB_PASSWORD && npm run db:seed
`);

const child = spawn("npx", ["next", "dev", "-p", PORT], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT,
    NEXTAUTH_URL: baseUrl,
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
