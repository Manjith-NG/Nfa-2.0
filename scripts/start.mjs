/**
 * Production start for Render/Railway — bind 0.0.0.0 and PORT from environment.
 */
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "3000";

console.log(`Starting Next.js on 0.0.0.0:${port}`);

const child = spawn("npx", ["next", "start", "-H", "0.0.0.0", "-p", port], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
