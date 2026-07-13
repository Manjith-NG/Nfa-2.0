import "dotenv/config";
import { ensureDemoAccounts } from "../src/lib/bootstrap/ensure-system-admin";
import { prisma } from "../src/lib/db";

async function main() {
  await ensureDemoAccounts();
  const rows = await prisma.user.findMany({
    where: { email: { in: ["admin@gcu.edu.in", "developer@gcu.edu.in"] } },
    select: { email: true, employeeId: true, passwordHint: true },
  });
  console.log(rows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
