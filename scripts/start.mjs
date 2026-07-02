/**
 * Production start for Render/Railway — bind 0.0.0.0 and PORT from environment.
 */
import { spawn, spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveDatabaseEnv } from "./resolve-database-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "3000";

await resolveDatabaseEnv({ required: false });

if (process.env.DATABASE_URL) {
  const ensure = spawnSync("npx", ["tsx", "scripts/ensure-admin.ts"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (ensure.status !== 0) {
    console.warn("[start] Could not ensure system admin account — login may fail for admin@gcu.edu.in");
  }
}

if (!process.env.NEXTAUTH_URL) {
  console.warn(
    "[start] NEXTAUTH_URL is not set — set it to your Render URL (e.g. https://nfa-2-0v1.onrender.com)"
  );
}

console.log(`Starting Next.js on 0.0.0.0:${port}`);

const child = spawn("npx", ["next", "start", "-H", "0.0.0.0", "-p", port], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
