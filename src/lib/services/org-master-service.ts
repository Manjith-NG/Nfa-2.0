import { prisma } from "@/lib/db";
import {
  DEPARTMENTS_SEED,
  DESIGNATIONS_SEED,
  EMPLOYEE_POSITIONS_SEED,
} from "@/lib/data/org-master-seed";

export async function syncDepartmentsFromSeed() {
  await Promise.all(
    DEPARTMENTS_SEED.map((dept) =>
      prisma.department.upsert({
        where: { code: dept.code },
        create: { code: dept.code, name: dept.name, isActive: true },
        update: { name: dept.name, isActive: true },
      })
    )
  );
}

export async function syncDesignationsFromSeed() {
  await Promise.all(
    DESIGNATIONS_SEED.map((row, index) =>
      prisma.designation.upsert({
        where: { code: row.code },
        create: { code: row.code, name: row.name, sortOrder: index },
        update: { name: row.name, sortOrder: index, isActive: true },
      })
    )
  );
}

export async function syncEmployeePositionsFromSeed() {
  await Promise.all(
    EMPLOYEE_POSITIONS_SEED.map((row, index) =>
      prisma.employeePosition.upsert({
        where: { code: row.code },
        create: { code: row.code, name: row.name, sortOrder: index },
        update: { name: row.name, sortOrder: index, isActive: true },
      })
    )
  );
}

export async function syncOrgMasterFromSeed() {
  await syncDepartmentsFromSeed();
  await syncDesignationsFromSeed();
  await syncEmployeePositionsFromSeed();
}

export async function listActiveDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      hod: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function listDesignations() {
  return prisma.designation.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function listEmployeePositions() {
  return prisma.employeePosition.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function getDepartmentByCode(code: string) {
  return prisma.department.findUnique({ where: { code } });
}
