import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasPermission, canEditUsers } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";
import { z } from "zod";

const createSchema = z.object({
  employeeId: z.string().min(2),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  departmentId: z.string(),
  designationId: z.string().optional(),
  positionId: z.string().optional(),
  password: z.string().min(6).optional(),
});

function canListUsers(user: { roleCode: string; departmentId: string | null }) {
  if (hasPermission(user as never, "users:manage")) return "all";
  if (hasPermission(user as never, "authorities:manage")) return "all";
  if (user.roleCode === "HOD" && user.departmentId) return "department";
  return null;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = canListUsers(user);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const roleCode = searchParams.get("roleCode");
  const departmentIdParam = searchParams.get("departmentId");
  const search = searchParams.get("search")?.trim();

  const departmentId =
    scope === "department" ? user.departmentId! : departmentIdParam ?? undefined;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(roleCode ? { role: { code: roleCode as never } } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { employeeId: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: search ? 25 : undefined,
    select: {
      id: true,
      employeeId: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      departmentId: true,
      department: { select: { name: true, code: true } },
      designation: { select: { name: true, code: true } },
      position: { select: { name: true, code: true } },
      role: { select: { code: true, name: true } },
      ...(canEditUsers(user) ? { passwordHint: true } : {}),
    },
  });

  const data = canEditUsers(user)
    ? users.map(({ passwordHint, ...row }) => ({
        ...row,
        loginPassword: passwordHint ?? null,
      }))
    : users;

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const facultyRole = await prisma.role.findUniqueOrThrow({
      where: { code: "FACULTY" },
    });

    const password = data.password ?? DEMO_LOGIN_PASSWORD;
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        employeeId: data.employeeId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        passwordHash,
        passwordHint: password,
        roleId: facultyRole.id,
        departmentId: data.departmentId,
        designationId: data.designationId,
        positionId: data.positionId,
      },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        position: { select: { name: true } },
        role: { select: { name: true, code: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: created.id,
      newValue: { email: data.email, role: "FACULTY" },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
