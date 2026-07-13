import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";
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
 * Move users still on the legacy demo password (password123) to Faculty ID passwords.
 * Leaves custom passwords alone when passwordHint already stores a non-default value.
 */
async function migrateLegacyPasswordsToFacultyId(): Promise<void> {
  const legacyHintUsers = await prisma.user.findMany({
    where: { isActive: true, passwordHint: DEMO_LOGIN_PASSWORD },
    select: { id: true, employeeId: true },
  });

  for (const user of legacyHintUsers) {
    const facultyId = defaultPasswordForEmployeeId(user.employeeId);
    if (!facultyId) continue;
    const passwordHash = await bcrypt.hash(facultyId, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordHint: facultyId },
    });
  }

  const nullHintUsers = await prisma.user.findMany({
    where: { isActive: true, passwordHint: null },
    select: { id: true, employeeId: true, passwordHash: true },
  });

  for (const user of nullHintUsers) {
    const facultyId = defaultPasswordForEmployeeId(user.employeeId);
    if (!facultyId) continue;

    const isLegacyDefault = await bcrypt.compare(DEMO_LOGIN_PASSWORD, user.passwordHash);
    if (isLegacyDefault) {
      const passwordHash = await bcrypt.hash(facultyId, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordHint: facultyId },
      });
      continue;
    }

    const alreadyFacultyId = await bcrypt.compare(facultyId, user.passwordHash);
    if (alreadyFacultyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHint: facultyId },
      });
    }
  }
}

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

    const shouldResetToFacultyId =
      !existing.passwordHint ||
      existing.passwordHint === DEMO_LOGIN_PASSWORD ||
      (await bcrypt.compare(DEMO_LOGIN_PASSWORD, existing.passwordHash));

    await prisma.user.update({
      where: { email: account.email },
      data: {
        firstName: account.firstName,
        lastName: account.lastName,
        roleId: adminRole.id,
        departmentId: department?.id ?? null,
        isActive: true,
        ...(shouldResetToFacultyId
          ? { passwordHash, passwordHint: plainPassword }
          : {}),
      },
    });
  }

  try {
    await migrateLegacyPasswordsToFacultyId();
  } catch (error) {
    console.warn("[bootstrap] faculty-id password migration skipped:", error);
  }
}

/** @deprecated Use ensureDemoAccounts */
export async function ensureSystemAdminUser(): Promise<void> {
  await ensureDemoAccounts();
}
