import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      email: true,
      employeeId: true,
      passwordHash: true,
      passwordHint: true,
    },
    take: 15,
    orderBy: { email: "asc" },
  });

  for (const u of users) {
    const is123 = await bcrypt.compare("password123", u.passwordHash);
    const isEmp = await bcrypt.compare(u.employeeId, u.passwordHash);
    const isHint = u.passwordHint
      ? await bcrypt.compare(u.passwordHint, u.passwordHash)
      : false;
    console.log(
      JSON.stringify({
        email: u.email,
        emp: u.employeeId,
        hint: u.passwordHint,
        is123,
        isEmp,
        isHint,
      })
    );
  }

  const totals = await prisma.user.findMany({
    where: { isActive: true },
    select: { passwordHash: true, employeeId: true, passwordHint: true },
  });

  let c123 = 0;
  let cEmp = 0;
  let cHint = 0;
  let cOther = 0;

  for (const u of totals) {
    if (await bcrypt.compare("password123", u.passwordHash)) c123 += 1;
    else if (await bcrypt.compare(u.employeeId, u.passwordHash)) cEmp += 1;
    else if (u.passwordHint && (await bcrypt.compare(u.passwordHint, u.passwordHash)))
      cHint += 1;
    else cOther += 1;
  }

  console.log({
    total: totals.length,
    password123: c123,
    employeeId: cEmp,
    matchesHint: cHint,
    other: cOther,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
