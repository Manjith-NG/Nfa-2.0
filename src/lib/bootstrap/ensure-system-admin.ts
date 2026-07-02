import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const DEMO_PASSWORD = "password123";

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

/** Upsert system admin and developer demo accounts (safe on every deploy/start). */
export async function ensureDemoAccounts(): Promise<void> {
  const adminRole = await prisma.role.findUnique({ where: { code: "ADMIN" } });
  if (!adminRole) {
    console.warn("[bootstrap] ADMIN role missing — run npm run db:seed");
    return;
  }

  const department = await prisma.department.findFirst({
    where: { code: "ADMIN", isActive: true },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const account of DEMO_ACCOUNTS) {
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        employeeId: account.employeeId,
        email: account.email,
        passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        roleId: adminRole.id,
        departmentId: department?.id ?? null,
        isActive: true,
      },
      update: {
        passwordHash,
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
