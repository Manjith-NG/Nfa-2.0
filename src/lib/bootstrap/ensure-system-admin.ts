import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { defaultPasswordForEmployeeId } from "@/lib/user-password";

const DEMO_ACCOUNTS = [
  {
    employeeId: "ADMIN001",
    email: "admin@gcu.edu.in",
    firstName: "System",
    lastName: "Administrator",
    departmentCode: "ADMIN",
  },
  {
    employeeId: "DEV001",
    email: "developer@gcu.edu.in",
    firstName: "NFA",
    lastName: "Developer",
    departmentCode: "ADMIN",
  },
] as const;

/**
 * Fast upsert for admin/developer only.
 * Does NOT run bulk password migration (that blocked login for 60–90s).
 */
export async function ensureDemoAccounts(): Promise<void> {
  const adminRole = await prisma.role.findUnique({ where: { code: "ADMIN" } });
  if (!adminRole) {
    console.warn("[bootstrap] ADMIN role missing — run npm run db:seed");
    return;
  }

  const department = await prisma.department.findFirst({
    where: { code: "ADMIN", isActive: true },
  });

  for (const account of DEMO_ACCOUNTS) {
    const plainPassword = defaultPasswordForEmployeeId(account.employeeId);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        employeeId: account.employeeId,
        email: account.email,
        passwordHash,
        passwordHint: plainPassword,
        firstName: account.firstName,
        lastName: account.lastName,
        roleId: adminRole.id,
        departmentId: department?.id ?? null,
        isActive: true,
      },
      update: {
        employeeId: account.employeeId,
        passwordHash,
        passwordHint: plainPassword,
        firstName: account.firstName,
        lastName: account.lastName,
        roleId: adminRole.id,
        departmentId: department?.id ?? null,
        isActive: true,
      },
    });
  }
}

/** @deprecated Use ensureDemoAccounts */
export async function ensureSystemAdminUser(): Promise<void> {
  await ensureDemoAccounts();
}
