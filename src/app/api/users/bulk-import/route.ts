import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  parseFacultyImportCsv,
  type FacultyImportRowResult,
} from "@/lib/faculty/faculty-import";

const rowSchema = z.object({
  employeeId: z.string().min(2),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  departmentCode: z.string().min(1),
  designationCode: z.string().optional(),
  positionCode: z.string().optional(),
  password: z.string().min(6).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const csvText = typeof body.csv === "string" ? body.csv : "";
    if (!csvText.trim()) {
      return NextResponse.json({ success: false, error: "CSV content is required" }, { status: 400 });
    }

    const rows = parseFacultyImportCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No faculty rows found in the file" },
        { status: 400 }
      );
    }

    const [facultyRole, departments, designations, positions] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { code: "FACULTY" } }),
      prisma.department.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
      prisma.designation.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
      prisma.employeePosition.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
    ]);

    const deptByCode = Object.fromEntries(departments.map((d) => [d.code.toUpperCase(), d.id]));
    const desByCode = Object.fromEntries(designations.map((d) => [d.code.toUpperCase(), d.id]));
    const posByCode = Object.fromEntries(positions.map((p) => [p.code.toUpperCase(), p.id]));

    const results: FacultyImportRowResult[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2;
      const raw = rows[i];

      try {
        const data = rowSchema.parse(raw);
        const departmentId = deptByCode[data.departmentCode.toUpperCase()];
        if (!departmentId) {
          results.push({
            row: rowNumber,
            email: data.email,
            success: false,
            error: `Unknown department code: ${data.departmentCode}`,
          });
          continue;
        }

        const designationId = data.designationCode
          ? desByCode[data.designationCode.toUpperCase()]
          : undefined;
        if (data.designationCode && !designationId) {
          results.push({
            row: rowNumber,
            email: data.email,
            success: false,
            error: `Unknown designation code: ${data.designationCode}`,
          });
          continue;
        }

        const positionId = data.positionCode
          ? posByCode[data.positionCode.toUpperCase()]
          : undefined;
        if (data.positionCode && !positionId) {
          results.push({
            row: rowNumber,
            email: data.email,
            success: false,
            error: `Unknown position code: ${data.positionCode}`,
          });
          continue;
        }

        const passwordHash = await bcrypt.hash(data.password ?? "password123", 10);

        const createdUser = await prisma.user.create({
          data: {
            employeeId: data.employeeId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            passwordHash,
            roleId: facultyRole.id,
            departmentId,
            designationId,
            positionId,
          },
        });

        await createAuditLog({
          userId: user.id,
          action: "USER_CREATED",
          entityType: "User",
          entityId: createdUser.id,
          newValue: { email: data.email, role: "FACULTY", source: "bulk-import" },
        });

        created += 1;
        results.push({ row: rowNumber, email: data.email, success: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Invalid row";
        results.push({
          row: rowNumber,
          email: raw.email || `row ${rowNumber}`,
          success: false,
          error: message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: rows.length,
        created,
        failed: rows.length - created,
        results,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bulk import failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
