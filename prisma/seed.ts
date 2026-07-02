import "dotenv/config";
import { PrismaClient, RoleCode, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { syncNaacMetricsFromSeed } from "../src/lib/services/naac-service";
import { syncOrgMasterFromSeed, getDepartmentByCode } from "../src/lib/services/org-master-service";
import { DEFAULT_ACADEMIC_SECTIONS } from "../src/lib/services/academic-section-service";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const roles: { code: RoleCode; name: string }[] = [
    { code: "FACULTY", name: "Faculty" },
    { code: "HOD", name: "Head of Department" },
    { code: "CLUB_AUTHORITY", name: "Club Authority" },
    { code: "IQAC", name: "IQAC" },
    { code: "PMSEB", name: "PMSEB" },
    { code: "HR", name: "Human Resources" },
    { code: "COE", name: "Controller of Examinations" },
    { code: "REGISTRAR", name: "Registrar" },
    { code: "OFC", name: "OFC" },
    { code: "ADMIN", name: "System Administrator" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      create: { code: r.code, name: r.name, permissions: [] },
      update: { name: r.name },
    });
  }

  const statuses: { code: RequestStatus; label: string; color: string }[] = [
    { code: "DRAFT", label: "Draft", color: "#64748b" },
    { code: "PENDING", label: "Pending", color: "#ea580c" },
    { code: "UNDER_REVIEW", label: "Under Review", color: "#2563eb" },
    { code: "APPROVED", label: "Approved", color: "#16a34a" },
    { code: "REJECTED", label: "Rejected", color: "#dc2626" },
    { code: "RESEND", label: "Resend", color: "#ca8a04" },
    { code: "FORWARDED", label: "Forwarded", color: "#7c3aed" },
    { code: "COMPLETED", label: "Completed", color: "#059669" },
  ];

  for (const [i, s] of statuses.entries()) {
    await prisma.statusMaster.upsert({
      where: { code: s.code },
      create: { ...s, sortOrder: i },
      update: { label: s.label, color: s.color },
    });
  }

  await syncOrgMasterFromSeed();

  const dept = async (code: string) => {
    const row = await getDepartmentByCode(code);
    if (!row) throw new Error(`Department ${code} not found`);
    return row.id;
  };

  const designation = async (code: string) =>
    prisma.designation.findUniqueOrThrow({ where: { code } });
  const position = async (code: string) =>
    prisma.employeePosition.findUniqueOrThrow({ where: { code } });

  const departments = {
    CS: await dept("CS"),
    PHY: await dept("PHY"),
    IQAC_OFF: await dept("IQAC_OFF"),
    REG_OFF: await dept("REG_OFF"),
    EXAM: await dept("EXAM"),
    ADMIN: await dept("ADMIN"),
  };

  const desFaculty = await designation("FACULTY");
  const desHod = await designation("HOD");
  const posAsstProf = await position("ASST_PROFESSOR");
  const posProfessor = await position("PROFESSOR");

  const clubs = [
    { code: "SPORTS", name: "Sports Club" },
    { code: "PULSE", name: "Pulse Club" },
    { code: "PHD", name: "PHD Committee" },
    { code: "CORAL", name: "Coral Anniversary Committee" },
    { code: "CULTURAL", name: "Cultural Club" },
    { code: "RESEARCH", name: "Research Club" },
    { code: "EVENT", name: "Event Committee" },
  ];

  const clubIds: Record<string, string> = {};
  for (const c of clubs) {
    const club = await prisma.club.upsert({
      where: { code: c.code },
      create: c,
      update: { name: c.name },
    });
    clubIds[c.code] = club.id;
  }

  async function getRole(code: RoleCode) {
    return prisma.role.findUniqueOrThrow({ where: { code } });
  }

  const users = [
    {
      employeeId: "FAC001",
      email: "faculty.cse@gcu.edu.in",
      firstName: "Raj",
      lastName: "Kumar",
      role: "FACULTY" as RoleCode,
      dept: "CS" as const,
      designationId: desFaculty.id,
      positionId: posAsstProf.id,
    },
    {
      employeeId: "FAC002",
      email: "faculty.cs2@gcu.edu.in",
      firstName: "Anita",
      lastName: "Desai",
      role: "FACULTY" as RoleCode,
      dept: "CS" as const,
      designationId: desFaculty.id,
      positionId: posAsstProf.id,
    },
    {
      employeeId: "HOD001",
      email: "hod.cse@gcu.edu.in",
      firstName: "Priya",
      lastName: "Sharma",
      role: "HOD" as RoleCode,
      dept: "CS" as const,
      designationId: desHod.id,
      positionId: posProfessor.id,
    },
    {
      employeeId: "FACPHY001",
      email: "faculty.phy@gcu.edu.in",
      firstName: "Chidanand",
      lastName: "Shinde",
      role: "FACULTY" as RoleCode,
      dept: "PHY" as const,
      designationId: desFaculty.id,
      positionId: posAsstProf.id,
    },
    {
      employeeId: "FACPHY002",
      email: "faculty.phy2@gcu.edu.in",
      firstName: "Meena",
      lastName: "Kulkarni",
      role: "FACULTY" as RoleCode,
      dept: "PHY" as const,
      designationId: desFaculty.id,
      positionId: posProfessor.id,
    },
    {
      employeeId: "HODPHY001",
      email: "hod.phy@gcu.edu.in",
      firstName: "Ravi",
      lastName: "Patil",
      role: "HOD" as RoleCode,
      dept: "PHY" as const,
      designationId: desHod.id,
      positionId: posProfessor.id,
    },
    {
      employeeId: "CLUB001",
      email: "club.sports@gcu.edu.in",
      firstName: "Amit",
      lastName: "Verma",
      role: "CLUB_AUTHORITY" as RoleCode,
      dept: "CS" as const,
      designationId: desFaculty.id,
      positionId: posAsstProf.id,
    },
    {
      employeeId: "IQAC001",
      email: "iqac@gcu.edu.in",
      firstName: "Sunita",
      lastName: "Reddy",
      role: "IQAC" as RoleCode,
      dept: "IQAC_OFF" as const,
    },
    {
      employeeId: "PMSEB001",
      email: "pmseb@gcu.edu.in",
      firstName: "Vikram",
      lastName: "Singh",
      role: "PMSEB" as RoleCode,
    },
    {
      employeeId: "HR001",
      email: "hr@gcu.edu.in",
      firstName: "Meera",
      lastName: "Krishnan",
      role: "HR" as RoleCode,
    },
    {
      employeeId: "COE001",
      email: "coe@gcu.edu.in",
      firstName: "Lakshmi",
      lastName: "Nair",
      role: "COE" as RoleCode,
      dept: "EXAM" as const,
    },
    {
      employeeId: "REG001",
      email: "registrar@gcu.edu.in",
      firstName: "Anil",
      lastName: "Menon",
      role: "REGISTRAR" as RoleCode,
      dept: "REG_OFF" as const,
    },
    {
      employeeId: "OFC001",
      email: "ofc@gcu.edu.in",
      firstName: "Deepa",
      lastName: "Iyer",
      role: "OFC" as RoleCode,
    },
    {
      employeeId: "ADMIN001",
      email: "admin@gcu.edu.in",
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN" as RoleCode,
      dept: "ADMIN" as const,
    },
    {
      employeeId: "DEV001",
      email: "developer@gcu.edu.in",
      firstName: "NFA",
      lastName: "Developer",
      role: "ADMIN" as RoleCode,
      dept: "ADMIN" as const,
    },
  ];

  const userIds: Record<string, string> = {};

  for (const u of users) {
    const role = await getRole(u.role);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        employeeId: u.employeeId,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: role.id,
        departmentId: u.dept ? departments[u.dept] : null,
        designationId: "designationId" in u ? u.designationId : undefined,
        positionId: "positionId" in u ? u.positionId : undefined,
      },
      update: {
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: role.id,
        departmentId: u.dept ? departments[u.dept] : null,
        designationId: "designationId" in u ? u.designationId : undefined,
        positionId: "positionId" in u ? u.positionId : undefined,
      },
    });
    userIds[u.email] = user.id;
  }

  await prisma.department.update({
    where: { id: departments.CS },
    data: { hodId: userIds["hod.cse@gcu.edu.in"] },
  });

  await prisma.department.update({
    where: { id: departments.PHY },
    data: { hodId: userIds["hod.phy@gcu.edu.in"] },
  });

  await prisma.clubAuthority.upsert({
    where: {
      clubId_userId: {
        clubId: clubIds.SPORTS,
        userId: userIds["club.sports@gcu.edu.in"],
      },
    },
    create: {
      clubId: clubIds.SPORTS,
      userId: userIds["club.sports@gcu.edu.in"],
    },
    update: { isActive: true },
  });

  for (const roleCode of ["IQAC", "PMSEB", "HR", "COE", "REGISTRAR", "OFC"] as RoleCode[]) {
    const email = `${roleCode.toLowerCase()}@gcu.edu.in`;
    if (userIds[email]) {
      const existing = await prisma.authorityMapping.findFirst({
        where: { roleCode, userId: userIds[email], isActive: true },
      });
      if (!existing) {
        await prisma.authorityMapping.create({
          data: {
            roleCode,
            userId: userIds[email],
            assignmentType: "PERMANENT",
            isActive: true,
          },
        });
      }
    }
  }

  const academicSteps = [
    { category: "ACADEMIC" as const, stepOrder: 1, roleCode: "HOD" as RoleCode, stepLabel: "HOD Approval" },
    { category: "ACADEMIC" as const, stepOrder: 2, roleCode: "IQAC" as RoleCode, stepLabel: "IQAC Approval" },
    { category: "ACADEMIC" as const, stepOrder: 3, roleCode: "PMSEB" as RoleCode, stepLabel: "PMSEB Approval" },
    { category: "ACADEMIC" as const, stepOrder: 4, roleCode: "COE" as RoleCode, stepLabel: "COE Approval" },
    { category: "ACADEMIC" as const, stepOrder: 5, roleCode: "REGISTRAR" as RoleCode, stepLabel: "Registrar Approval" },
    { category: "ACADEMIC" as const, stepOrder: 6, roleCode: "OFC" as RoleCode, stepLabel: "OFC Final Approval" },
  ];

  const clubSteps = [
    { category: "CLUB" as const, stepOrder: 1, roleCode: "CLUB_AUTHORITY" as RoleCode, stepLabel: "Club Authority" },
    { category: "CLUB" as const, stepOrder: 2, roleCode: "IQAC" as RoleCode, stepLabel: "IQAC Approval" },
    { category: "CLUB" as const, stepOrder: 3, roleCode: "PMSEB" as RoleCode, stepLabel: "PMSEB Approval" },
    { category: "CLUB" as const, stepOrder: 4, roleCode: "COE" as RoleCode, stepLabel: "COE Approval" },
    { category: "CLUB" as const, stepOrder: 5, roleCode: "REGISTRAR" as RoleCode, stepLabel: "Registrar Approval" },
    { category: "CLUB" as const, stepOrder: 6, roleCode: "OFC" as RoleCode, stepLabel: "OFC Final Approval" },
  ];

  for (const step of [...academicSteps, ...clubSteps]) {
    await prisma.approvalWorkflow.upsert({
      where: { category_stepOrder: { category: step.category, stepOrder: step.stepOrder } },
      create: step,
      update: { stepLabel: step.stepLabel, roleCode: step.roleCode },
    });
  }

  for (const section of DEFAULT_ACADEMIC_SECTIONS) {
    await prisma.academicSectionMaster.upsert({
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
    });
  }

  const sections = await prisma.academicSectionMaster.findMany({
    select: { id: true, code: true },
  });
  const sectionIdByCode = Object.fromEntries(sections.map((s) => [s.code, s.id]));

  const workflowTemplates = [
    {
      name: "Department — HOD → IQAC → PMSEB → Registrar",
      category: "ACADEMIC" as const,
      academicSectionCode: "DEPT" as const,
      steps: ["HOD", "IQAC", "PMSEB"],
      isDefault: false,
    },
    {
      name: "Academic — IQAC → PMSEB → Registrar",
      category: "ACADEMIC" as const,
      academicSectionCode: null,
      steps: ["IQAC", "PMSEB"],
      isDefault: true,
    },
    {
      name: "Academic — IQAC → Registrar",
      category: "ACADEMIC" as const,
      academicSectionCode: "GEN" as const,
      steps: ["IQAC"],
      isDefault: false,
    },
    {
      name: "Academic — PMSEB → Registrar",
      category: "ACADEMIC" as const,
      academicSectionCode: "EXO" as const,
      steps: ["PMSEB"],
      isDefault: false,
    },
    {
      name: "HR section — HR → IQAC → PMSEB → COE",
      category: "ACADEMIC" as const,
      academicSectionCode: "HR" as const,
      steps: ["HR", "IQAC", "PMSEB", "COE"],
      isDefault: false,
    },
    {
      name: "COE section — COE → IQAC → PMSEB",
      category: "ACADEMIC" as const,
      academicSectionCode: "COE" as const,
      steps: ["COE", "IQAC", "PMSEB"],
      isDefault: false,
    },
    {
      name: "Club — Club Authority → IQAC → PMSEB → Registrar",
      category: "CLUB" as const,
      academicSectionCode: null,
      steps: ["CLUB_AUTHORITY", "IQAC", "PMSEB"],
      isDefault: true,
    },
  ];

  for (const template of workflowTemplates) {
    const academicSectionId = template.academicSectionCode
      ? sectionIdByCode[template.academicSectionCode] ?? null
      : null;
    const existing = await prisma.workflowTemplate.findFirst({
      where: {
        name: template.name,
        category: template.category,
        academicSectionId,
        clubId: "clubId" in template ? (template.clubId ?? null) : null,
      },
    });
    if (!existing) {
      await prisma.workflowTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          academicSectionId,
          clubId:
            "clubId" in template && typeof template.clubId === "string"
              ? template.clubId
              : undefined,
          steps: template.steps,
          isDefault: template.isDefault,
        },
      });
    }
  }

  await syncNaacMetricsFromSeed();

  const { ensureDemoAccounts } = await import("../src/lib/bootstrap/ensure-system-admin");
  await ensureDemoAccounts();

  console.log("\n✅ NFA seed completed. Demo accounts (password: password123):\n");
  users.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
