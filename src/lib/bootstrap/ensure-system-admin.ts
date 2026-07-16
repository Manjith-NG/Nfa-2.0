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
 * Ensure admin/developer exist. Skips work when already present so login stays fast on Render.
 */
export async function ensureDemoAccounts(): Promise<void> {
  const existing = await prisma.user.findMany({
    where: { email: { in: DEMO_ACCOUNTS.map((a) => a.email) } },
    select: { email: true, employeeId: true, isActive: true },
  });

  const byEmail = new Map(existing.map((u) => [u.email, u]));
  const allReady = DEMO_ACCOUNTS.every((account) => {
    const row = byEmail.get(account.email);
    return row?.isActive && row.employeeId === account.employeeId;
  });

  if (allReady) return;

  const adminRole = await prisma.role.findUnique({ where: { code: "ADMIN" } });
  if (!adminRole) {
    console.warn("[bootstrap] ADMIN role missing — run npm run db:seed");
    return;
  }

  const department = await prisma.department.findFirst({
    where: { code: "ADMIN", isActive: true },
  });

  for (const account of DEMO_ACCOUNTS) {
    const current = byEmail.get(account.email);
    if (current?.isActive && current.employeeId === account.employeeId) {
      continue;
    }

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
