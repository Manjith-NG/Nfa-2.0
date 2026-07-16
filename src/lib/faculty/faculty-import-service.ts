import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  normalizeFacultyImportRow,
  parseFacultyImportCsv,
  resolveOrgCode,
  type FacultyImportRow,
  type FacultyImportRowResult,
} from "@/lib/faculty/faculty-import";
import { departmentDisplayName, mapRoleCode } from "@/lib/faculty/import-mappings";
import { defaultPasswordForEmployeeId } from "@/lib/user-password";
import type { RoleCode } from "@prisma/client";

const rowSchema = z.object({
  employeeId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  departmentCode: z.string().min(1),
  designationCode: z.string().optional(),
  positionCode: z.string().optional(),
  roleCode: z.string().optional(),
  password: z.string().min(6).optional(),
});

export type FacultyImportSummary = {
  total: number;
  created: number;
  updated: number;
  failed: number;
  results: FacultyImportRowResult[];
};

function formatImportError(error: unknown): string {
  if (!(error instanceof Error)) return "Invalid row";
  const message = error.message;
  if (message.includes("Unique constraint failed on the fields: (`employeeId`)")) {
    return "Employee ID (faculty ID number) already exists for another user";
  }
  if (message.includes("Unique constraint failed on the fields: (`email`)")) {
    return "Email already exists for another user";
  }
  return message;
}

function findDuplicateKeys(rows: FacultyImportRow[]): Map<number, string> {
  const errors = new Map<number, string>();
  const employeeIds = new Map<string, number>();
  const emails = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const employeeId = row.employeeId.trim();
    const email = row.email.toLowerCase().trim();

    const dupEmp = employeeIds.get(employeeId);
    if (dupEmp !== undefined) {
      errors.set(rowNumber, `Duplicate employee ID ${employeeId} (also on row ${dupEmp})`);
    } else {
      employeeIds.set(employeeId, rowNumber);
    }

    const dupEmail = emails.get(email);
    if (dupEmail !== undefined) {
      errors.set(rowNumber, `Duplicate email ${email} (also on row ${dupEmail})`);
    } else {
      emails.set(email, rowNumber);
    }
  });

  return errors;
}

async function ensureDepartment(
  code: string,
  deptByCode: Record<string, string>
): Promise<string | undefined> {
  const upper = code.toUpperCase();
  const existing = deptByCode[upper];
  if (existing) return existing;

  const created = await prisma.department.upsert({
    where: { code: upper },
    create: {
      code: upper,
      name: departmentDisplayName(upper),
      isActive: true,
    },
    update: { isActive: true },
  });
  deptByCode[upper] = created.id;
  return created.id;
}

export async function importFacultyFromCsv(
  csvText: string,
  options: { actorUserId?: string } = {}
): Promise<FacultyImportSummary> {
  const rows = parseFacultyImportCsv(csvText).map(normalizeFacultyImportRow);
  if (rows.length === 0) {
    throw new Error("No faculty rows found in the file");
  }

  const duplicateErrors = findDuplicateKeys(rows);

  const [roles, departments, designations, positions] = await Promise.all([
    prisma.role.findMany({ select: { id: true, code: true } }),
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
    prisma.designation.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
    prisma.employeePosition.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
  ]);

  const roleByCode = Object.fromEntries(roles.map((r) => [r.code, r.id])) as Record<RoleCode, string>;
  const facultyRoleId = roleByCode.FACULTY;
  if (!facultyRoleId) {
    throw new Error("FACULTY role is not configured");
  }

  const deptByCode = Object.fromEntries(departments.map((d) => [d.code.toUpperCase(), d.id]));
  const desByCode = Object.fromEntries(designations.map((d) => [d.code.toUpperCase(), d.id]));
  const posByCode = Object.fromEntries(positions.map((p) => [p.code.toUpperCase(), p.id]));

  const results: FacultyImportRowResult[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2;
    const raw = rows[i];

    const duplicateError = duplicateErrors.get(rowNumber);
    if (duplicateError) {
      results.push({
        row: rowNumber,
        email: raw.email,
        employeeId: raw.employeeId,
        success: false,
        error: duplicateError,
      });
      continue;
    }

    try {
      const data = rowSchema.parse(raw);
      const email = data.email.toLowerCase().trim();
      const employeeId = data.employeeId.trim();

      const departmentId = await ensureDepartment(data.departmentCode.toUpperCase(), deptByCode);
      if (!departmentId) {
        results.push({
          row: rowNumber,
          email,
          employeeId,
          success: false,
          error: `Unknown department code: ${data.departmentCode}`,
        });
        continue;
      }

      const designationId = data.designationCode
        ? desByCode[
            resolveOrgCode(data.designationCode, Object.keys(desByCode)) ??
              data.designationCode.toUpperCase()
          ]
        : undefined;
      if (data.designationCode && !designationId) {
        results.push({
          row: rowNumber,
          email,
          employeeId,
          success: false,
          error: `Unknown designation code: ${data.designationCode}`,
        });
        continue;
      }

      const positionId = data.positionCode
        ? posByCode[
            resolveOrgCode(data.positionCode, Object.keys(posByCode)) ??
              data.positionCode.toUpperCase()
          ]
        : undefined;
      if (data.positionCode && !positionId) {
        results.push({
          row: rowNumber,
          email,
          employeeId,
          success: false,
          error: `Unknown position code: ${data.positionCode}`,
        });
        continue;
      }

      const existingByEmployeeId = await prisma.user.findUnique({
        where: { employeeId },
        include: { role: { select: { code: true } } },
      });
      const existingByEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: { role: { select: { code: true } } },
      });

      if (
        existingByEmail &&
        existingByEmployeeId &&
        existingByEmail.id !== existingByEmployeeId.id
      ) {
        const demoEmployeePattern = /^(COE|FAC|HOD|ADMIN|REG|OFC|DEV|PMSEB)\d+$/i;
        const emailHolderIsDemo =
          demoEmployeePattern.test(existingByEmail.employeeId ?? "") ||
          existingByEmail.role.code !== "FACULTY";

        if (emailHolderIsDemo) {
          const localPart = existingByEmail.email.split("@")[0] ?? "demo";
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { email: `${localPart}.demo.${employeeId}@gcu.edu.in` },
          });
        } else {
          results.push({
            row: rowNumber,
            email,
            employeeId,
            success: false,
            error: `Email belongs to ${existingByEmail.email} but employee ID belongs to ${existingByEmployeeId.email}`,
          });
          continue;
        }
      }

      const existing = existingByEmployeeId ?? existingByEmail;
      const roleCode = data.roleCode ? mapRoleCode(data.roleCode) : "FACULTY";
      const roleId = roleByCode[roleCode] ?? facultyRoleId;
      const userData = {
        employeeId,
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        departmentId,
        designationId,
        positionId,
        roleId,
      };

      if (existing) {
        const plainPassword =
          data.password ?? defaultPasswordForEmployeeId(employeeId);
        const passwordHash = data.password
          ? await bcrypt.hash(data.password, 10)
          : undefined;
        const saved = await prisma.user.update({
          where: { id: existing.id },
          data: {
            ...userData,
            ...(passwordHash
              ? { passwordHash, passwordHint: plainPassword }
              : {}),
          },
        });

        if (options.actorUserId) {
          await createAuditLog({
            userId: options.actorUserId,
            action: "USER_UPDATED",
            entityType: "User",
            entityId: saved.id,
            newValue: { email, role: roleCode, source: "bulk-import" },
          });
        }

        updated += 1;
        results.push({
          row: rowNumber,
          email,
          employeeId,
          success: true,
          action: "updated",
        });
        continue;
      }

      const plainPassword =
        data.password ?? defaultPasswordForEmployeeId(employeeId);
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const saved = await prisma.user.create({
        data: {
          ...userData,
          passwordHash,
          passwordHint: plainPassword,
        },
      });

      if (options.actorUserId) {
        await createAuditLog({
          userId: options.actorUserId,
          action: "USER_CREATED",
          entityType: "User",
          entityId: saved.id,
          newValue: { email, role: roleCode, source: "bulk-import" },
        });
      }

      created += 1;
      results.push({
        row: rowNumber,
        email,
        employeeId,
        success: true,
        action: "created",
      });
    } catch (e) {
      results.push({
        row: rowNumber,
        email: raw.email || `row ${rowNumber}`,
        employeeId: raw.employeeId,
        success: false,
        error: formatImportError(e),
      });
    }
  }

  const failed = results.filter((r) => !r.success).length;

  return {
    total: rows.length,
    created,
    updated,
    failed,
    results,
  };
}
