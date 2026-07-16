import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { importFacultyFromCsv } from "../src/lib/faculty/faculty-import-service";
import { prisma } from "../src/lib/db";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fileArg = process.argv[2] ?? "data/faculty-upload.csv";
const csvPath = resolve(root, fileArg);

if (!existsSync(csvPath)) {
  console.error(`[import-faculty] File not found: ${csvPath}`);
  console.error("Save your Excel as CSV UTF-8 to data/faculty-upload.csv, or pass a path:");
  console.error("  npx tsx scripts/import-faculty-csv.ts path/to/faculty.csv");
  process.exit(1);
}

const csv = readFileSync(csvPath, "utf8");

importFacultyFromCsv(csv)
  .then((summary) => {
    console.log(
      `[import-faculty] Done: ${summary.created} created, ${summary.updated} updated, ${summary.failed} failed (of ${summary.total})`
    );
    if (summary.failed > 0) {
      for (const row of summary.results.filter((r) => !r.success)) {
        console.error(`  Row ${row.row} (${row.email}): ${row.error}`);
      }
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("[import-faculty] Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
