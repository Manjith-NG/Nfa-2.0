import { prisma } from "@/lib/db";
import type { RoleCode } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";

export const DEFAULT_ACADEMIC_SECTIONS: {
  code: string;
  name: string;
  description: string;
  entryRole: RoleCode;
}[] = [
  {
    code: "PHD",
    name: "Research (PhD)",
    description: "PhD / research proposals",
    entryRole: "IQAC",
  },
  {
    code: "RO",
    name: "Registrar's Office (RO)",
    description: "Registrar office matters",
    entryRole: "IQAC",
  },
  {
    code: "EXO",
    name: "Examination Office (EXO)",
    description: "Examination office matters",
    entryRole: "IQAC",
  },
  {
    code: "GEN",
    name: "Generic (GEN)",
    description: "General academic requests",
    entryRole: "IQAC",
  },
  {
    code: "DEPT",
    name: "Department (Dept)",
    description: "Department-level — routes to your HOD first",
    entryRole: "HOD",
  },
  {
    code: "HR",
    name: "Human Resources (HR)",
    description: "HR matters — routes to HR for approval first",
    entryRole: "HR",
  },
  {
    code: "COE",
    name: "Controller of Examinations (COE)",
    description: "Examination / COE matters — routes to COE first",
    entryRole: "COE",
  },
];

export type AcademicSectionListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  entryRole: RoleCode;
  routesTo: string;
};

function routesToLabel(entryRole: RoleCode): string {
  if (entryRole === "HOD") return "HOD";
  if (entryRole === "OFC") return "OFC";
  return ROLE_LABELS[entryRole] ?? entryRole;
}

/** Ensure built-in sections exist, then return active sections. */
export async function listActiveAcademicSections(): Promise<AcademicSectionListItem[]> {
  await Promise.all(
    DEFAULT_ACADEMIC_SECTIONS.map((section) =>
      prisma.academicSectionMaster.upsert({
        where: { code: section.code },
        create: {
          code: section.code,
          name: section.name,
          description: section.description,
          entryRole: section.entryRole,
          isActive: true,
        },
        update: {
          name: section.name,
          description: section.description,
          entryRole: section.entryRole,
          isActive: true,
        },
      })
    )
  );

  const sections = await prisma.academicSectionMaster.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      entryRole: true,
    },
  });

  return sections.map((section) => ({
    ...section,
    routesTo: routesToLabel(section.entryRole),
  }));
}

const ENTRY_ROLE_OPTIONS: RoleCode[] = ["IQAC", "HOD", "HR", "COE"];

export async function createAcademicSection(data: {
  code: string;
  name: string;
  description?: string;
  entryRole?: RoleCode;
}) {
  const code = data.code.trim().toUpperCase().replace(/\s+/g, "_");
  const name = data.name.trim();
  const entryRole = data.entryRole ?? "IQAC";

  if (!code || code.length < 2) {
    throw new Error("Section code must be at least 2 characters");
  }
  if (!name) {
    throw new Error("Section name is required");
  }
  if (!ENTRY_ROLE_OPTIONS.includes(entryRole)) {
    throw new Error("Entry role must be IQAC, HOD, HR, or COE");
  }

  const existing = await prisma.academicSectionMaster.findUnique({ where: { code } });
  if (existing) {
    throw new Error("An academic section with this code already exists");
  }

  const section = await prisma.academicSectionMaster.create({
    data: {
      code,
      name,
      description: data.description?.trim() || null,
      entryRole,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      entryRole: true,
    },
  });

  return {
    ...section,
    routesTo: routesToLabel(section.entryRole),
  };
}

export async function getAcademicSectionById(id: string) {
  return prisma.academicSectionMaster.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      entryRole: true,
    },
  });
}
