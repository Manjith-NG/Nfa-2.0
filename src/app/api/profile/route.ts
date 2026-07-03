import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z
    .string()
    .max(15)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      employeeId: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      department: { select: { name: true, code: true } },
      designation: { select: { name: true } },
      position: { select: { name: true } },
      role: { select: { code: true, name: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone,
      },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: { select: { name: true, code: true } },
        designation: { select: { name: true } },
        position: { select: { name: true } },
        role: { select: { code: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "PROFILE_UPDATED",
      entityType: "User",
      entityId: user.id,
      newValue: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
