/**
 * One-shot: reset every password123 account to Faculty / Employee ID.
 * Usage: npx tsx scripts/migrate-faculty-id-passwords.ts
 */
import "dotenv/config";
import { migrateLegacyPasswordsToFacultyId } from "../src/lib/bootstrap/migrate-faculty-id-passwords";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("Migrating password123 → Faculty ID…");
  const result = await migrateLegacyPasswordsToFacultyId();
  console.log(result);

  const sample = await prisma.user.findMany({
    where: { isActive: true },
    take: 5,
    orderBy: { email: "asc" },
    select: { email: true, employeeId: true, passwordHint: true },
  });
  console.log("Sample hints:", sample);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
