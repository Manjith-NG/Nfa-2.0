import bcrypt from "bcryptjs";
import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const userAuthInclude = {
  role: true,
  department: true,
  designation: true,
  position: true,
} as const;

export type LoginOption = {
  email: string;
  employeeId: string;
  roleName: string;
  roleCode: RoleCode;
  label: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  roleCode: RoleCode;
  roleName: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  designationName: string | null;
  positionName: string | null;
};

/** Active users from the `users` table — one entry per role for the login picker. */
export async function getLoginOptions(): Promise<LoginOption[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { role: true },
    orderBy: [{ role: { name: "asc" } }, { email: "asc" }],
  });

  const seenRoles = new Set<RoleCode>();
  const options: LoginOption[] = [];

  for (const user of users) {
    if (seenRoles.has(user.role.code) && user.email !== "developer@gcu.edu.in") continue;
    if (user.email !== "developer@gcu.edu.in") {
      seenRoles.add(user.role.code);
    }
    options.push({
      email: user.email,
      employeeId: user.employeeId,
      roleName: user.email === "developer@gcu.edu.in" ? "Developer" : user.role.name,
      roleCode: user.role.code,
      label: user.email === "developer@gcu.edu.in" ? "Developer" : user.role.name,
    });
  }

  return options;
}

/** Validate credentials against the `users` table and record login. */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: userAuthInclude,
  });

  if (!user || !user.isActive) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    newValue: { email: user.email, roleCode: user.role.code },
  });

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    roleCode: user.role.code,
    roleName: user.role.name,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    departmentId: user.departmentId,
    departmentCode: user.department?.code ?? null,
    departmentName: user.department?.name ?? null,
    designationName: user.designation?.name ?? null,
    positionName: user.position?.name ?? null,
  };
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/** Update password for the signed-in user in the `users` table. */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    return { ok: false, error: "Account not found." };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect." };
  }

  if (currentPassword === newPassword) {
    return { ok: false, error: "New password must be different from the current password." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordHint: newPassword },
  });

  await createAuditLog({
    userId,
    action: "PASSWORD_CHANGE",
    entityType: "User",
    entityId: userId,
  });

  return { ok: true };
}
