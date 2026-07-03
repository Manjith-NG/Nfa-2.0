import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canDeleteUsers, canEditUsers, hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { PROTECTED_SYSTEM_EMAILS } from "@/lib/constants";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";
import { resolveLoginPassword } from "@/lib/user-password";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  employeeId: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .max(15)
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  departmentId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
});

const userSelect = {
  id: true,
  employeeId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  departmentId: true,
  designationId: true,
  positionId: true,
  department: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
  role: { select: { code: true, name: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!hasPermission(user, "users:manage") && !canEditUsers(user) && user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = canEditUsers(user)
    ? await prisma.user.findUnique({
        where: { id, isActive: true },
        select: { ...userSelect, passwordHash: true, passwordHint: true },
      })
    : await prisma.user.findUnique({
        where: { id, isActive: true },
        select: userSelect,
      });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (canEditUsers(user) && profile && "passwordHash" in profile) {
    const developerProfile = profile as typeof profile & {
      passwordHash: string;
      passwordHint: string | null;
    };
    const loginPassword = await resolveLoginPassword(
      developerProfile.passwordHash,
      developerProfile.passwordHint
    );
    const { passwordHash: _hash, passwordHint: _hint, ...safeProfile } = developerProfile;
    return NextResponse.json({
      success: true,
      data: {
        ...safeProfile,
        loginPassword: loginPassword,
        loginPasswordIsEstimated: !developerProfile.passwordHint && loginPassword === DEMO_LOGIN_PASSWORD,
        loginPasswordKnown: Boolean(loginPassword),
      },
    });
  }

  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditUsers(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id, isActive: true },
      select: { id: true, email: true, employeeId: true, passwordHash: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const email = existing.email.toLowerCase();
    const isProtected = PROTECTED_SYSTEM_EMAILS.some((protectedEmail) => protectedEmail === email);

    if (isProtected && data.email.toLowerCase() !== email) {
      return NextResponse.json(
        { success: false, error: "System account email cannot be changed" },
        { status: 400 }
      );
    }

    if (isProtected && data.employeeId !== existing.employeeId) {
      return NextResponse.json(
        { success: false, error: "System account employee ID cannot be changed" },
        { status: 400 }
      );
    }

    const updateData: {
      firstName: string;
      lastName: string;
      employeeId: string;
      email: string;
      phone: string | null;
      departmentId: string | null;
      designationId: string | null;
      positionId: string | null;
      passwordHash?: string;
      passwordHint?: string;
    } = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      employeeId: data.employeeId.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone,
      departmentId: data.departmentId || null,
      designationId: data.designationId || null,
      positionId: data.positionId || null,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      updateData.passwordHint = data.password;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { ...userSelect, passwordHash: true, passwordHint: true },
    });

    await createAuditLog({
      userId: actor.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      newValue: {
        ...data,
        password: data.password ? "[reset]" : undefined,
      },
    });

    const loginPassword = data.password
      ? data.password
      : await resolveLoginPassword(updated.passwordHash, updated.passwordHint);

    const { passwordHash: _hash, passwordHint: _hint, ...safeUpdated } = updated;

    return NextResponse.json({
      success: true,
      data: {
        ...safeUpdated,
        loginPassword,
        loginPasswordKnown: Boolean(loginPassword),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDeleteUsers(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
  });

  if (!target || !target.isActive) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const email = target.email.toLowerCase();
  if (PROTECTED_SYSTEM_EMAILS.some((protectedEmail) => protectedEmail === email)) {
    return NextResponse.json(
      { success: false, error: "System accounts cannot be deleted" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.authorityMapping.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      await tx.clubAuthority.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false },
      });

      await tx.department.updateMany({
        where: { hodId: id },
        data: { hodId: null },
      });

      await tx.user.update({
        where: { id },
        data: { isActive: false },
      });
    });

    await createAuditLog({
      userId: actor.id,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      oldValue: { email: target.email, name: `${target.firstName} ${target.lastName}` },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete user";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
