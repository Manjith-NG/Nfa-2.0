/**
 * Generate Prisma client with an explicit schema path (Render-safe).
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaRel = "./prisma/schema.prisma";
const schemaPath = resolve(root, "prisma", "schema.prisma");

if (!existsSync(schemaPath)) {
  console.error(`[prisma-generate] Schema not found at ${schemaPath}`);
  console.error("[prisma-generate] Ensure prisma/schema.prisma is committed to the repository.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", "generate", `--schema=${schemaRel}`], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
