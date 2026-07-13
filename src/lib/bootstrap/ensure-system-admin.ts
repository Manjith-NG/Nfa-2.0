import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { defaultPasswordForEmployeeId } from "@/lib/user-password";
import { migrateLegacyPasswordsToFacultyId } from "@/lib/bootstrap/migrate-faculty-id-passwords";

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

  for (const account of DEMO_ACCOUNTS) {
    const plainPassword = defaultPasswordForEmployeeId(account.employeeId);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true, passwordHint: true, passwordHash: true },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
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
      });
      continue;
    }

    // Always keep demo accounts on Faculty ID passwords (employeeId = password)
    await prisma.user.update({
      where: { email: account.email },
      data: {
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

  try {
    const result = await migrateLegacyPasswordsToFacultyId();
    if (result.updated > 0) {
      console.info(
        `[bootstrap] migrated ${result.updated}/${result.scanned} users to Faculty ID passwords`
      );
    }
  } catch (error) {
    console.warn("[bootstrap] faculty-id password migration skipped:", error);
  }
}

/** @deprecated Use ensureDemoAccounts */
export async function ensureSystemAdminUser(): Promise<void> {
  await ensureDemoAccounts();
}
