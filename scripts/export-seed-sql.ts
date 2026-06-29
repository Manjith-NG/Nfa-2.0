/**
 * Exports full NFA seed SQL for Supabase (users, workflows, NAAC metrics).
 * Run: npx tsx scripts/export-seed-sql.ts > supabase/full-seed.sql
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { NAAC_CRITERIA_SEED } from "../src/lib/data/naac-metrics-seed";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../supabase/full-seed.sql");

function esc(s: string) {
  return s.replace(/'/g, "''");
}

function jsonSteps(steps: string[]) {
  return `'${JSON.stringify(steps)}'::jsonb`;
}

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const lines: string[] = [
    "-- NFA full seed: users, authorities, workflows, NAAC metrics",
    "-- Password for all demo users: password123",
    "",
  ];

  const users = [
    { id: "usr_fac_cse", employeeId: "FAC001", email: "faculty.cse@gcu.edu.in", firstName: "Raj", lastName: "Kumar", roleId: "role_faculty", deptId: "dept_cs", desId: "des_faculty", posId: "pos_asst_prof" },
    { id: "usr_fac_cs2", employeeId: "FAC002", email: "faculty.cs2@gcu.edu.in", firstName: "Anita", lastName: "Desai", roleId: "role_faculty", deptId: "dept_cs", desId: "des_faculty", posId: "pos_asst_prof" },
    { id: "usr_hod_cse", employeeId: "HOD001", email: "hod.cse@gcu.edu.in", firstName: "Priya", lastName: "Sharma", roleId: "role_hod", deptId: "dept_cs", desId: "des_hod", posId: "pos_prof" },
    { id: "usr_fac_phy", employeeId: "FACPHY001", email: "faculty.phy@gcu.edu.in", firstName: "Chidanand", lastName: "Shinde", roleId: "role_faculty", deptId: "dept_phy", desId: "des_faculty", posId: "pos_asst_prof" },
    { id: "usr_fac_phy2", employeeId: "FACPHY002", email: "faculty.phy2@gcu.edu.in", firstName: "Meena", lastName: "Kulkarni", roleId: "role_faculty", deptId: "dept_phy", desId: "des_faculty", posId: "pos_prof" },
    { id: "usr_hod_phy", employeeId: "HODPHY001", email: "hod.phy@gcu.edu.in", firstName: "Ravi", lastName: "Patil", roleId: "role_hod", deptId: "dept_phy", desId: "des_hod", posId: "pos_prof" },
    { id: "usr_club", employeeId: "CLUB001", email: "club.sports@gcu.edu.in", firstName: "Amit", lastName: "Verma", roleId: "role_club", deptId: "dept_cs", desId: "des_faculty", posId: "pos_asst_prof" },
    { id: "usr_iqac", employeeId: "IQAC001", email: "iqac@gcu.edu.in", firstName: "Sunita", lastName: "Reddy", roleId: "role_iqac", deptId: "dept_iqac", desId: null, posId: null },
    { id: "usr_pmseb", employeeId: "PMSEB001", email: "pmseb@gcu.edu.in", firstName: "Vikram", lastName: "Singh", roleId: "role_pmseb", deptId: null, desId: null, posId: null },
    { id: "usr_hr", employeeId: "HR001", email: "hr@gcu.edu.in", firstName: "Meera", lastName: "Krishnan", roleId: "role_hr", deptId: null, desId: null, posId: null },
    { id: "usr_coe", employeeId: "COE001", email: "coe@gcu.edu.in", firstName: "Lakshmi", lastName: "Nair", roleId: "role_coe", deptId: "dept_exam", desId: null, posId: null },
    { id: "usr_reg", employeeId: "REG001", email: "registrar@gcu.edu.in", firstName: "Anil", lastName: "Menon", roleId: "role_registrar", deptId: "dept_reg", desId: null, posId: null },
    { id: "usr_ofc", employeeId: "OFC001", email: "ofc@gcu.edu.in", firstName: "Deepa", lastName: "Iyer", roleId: "role_ofc", deptId: null, desId: null, posId: null },
  ];

  lines.push("-- Users");
  for (const u of users) {
    const des = u.desId ? `'${u.desId}'` : "NULL";
    const pos = u.posId ? `'${u.posId}'` : "NULL";
    const dept = u.deptId ? `'${u.deptId}'` : "NULL";
    lines.push(
      `INSERT INTO users (id, "employeeId", email, "passwordHash", "firstName", "lastName", "roleId", "departmentId", "designationId", "positionId") VALUES ('${u.id}', '${u.employeeId}', '${u.email}', '${hash}', '${esc(u.firstName)}', '${esc(u.lastName)}', '${u.roleId}', ${dept}, ${des}, ${pos}) ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "roleId" = EXCLUDED."roleId", "departmentId" = EXCLUDED."departmentId", "designationId" = EXCLUDED."designationId", "positionId" = EXCLUDED."positionId";`
    );
  }

  lines.push("", "-- HOD assignments");
  lines.push(`UPDATE departments SET "hodId" = 'usr_hod_cse' WHERE id = 'dept_cs';`);
  lines.push(`UPDATE departments SET "hodId" = 'usr_hod_phy' WHERE id = 'dept_phy';`);

  lines.push("", "-- Club authority");
  lines.push(
    `INSERT INTO club_authorities (id, "clubId", "userId") VALUES ('ca_sports', 'club_sports', 'usr_club') ON CONFLICT ("clubId", "userId") DO UPDATE SET "isActive" = TRUE;`
  );

  lines.push("", "-- Authority mapping");
  const authorities = [
    { id: "am_iqac", role: "IQAC", userId: "usr_iqac" },
    { id: "am_pmseb", role: "PMSEB", userId: "usr_pmseb" },
    { id: "am_hr", role: "HR", userId: "usr_hr" },
    { id: "am_coe", role: "COE", userId: "usr_coe" },
    { id: "am_reg", role: "REGISTRAR", userId: "usr_reg" },
    { id: "am_ofc", role: "OFC", userId: "usr_ofc" },
  ];
  for (const a of authorities) {
    lines.push(
      `INSERT INTO authority_mapping (id, "roleCode", "userId", "assignmentType", "isActive") VALUES ('${a.id}', '${a.role}', '${a.userId}', 'PERMANENT', TRUE) ON CONFLICT DO NOTHING;`
    );
  }

  lines.push("", "-- Approval workflow");
  const academicSteps = [
    [1, "HOD", "HOD Approval"],
    [2, "IQAC", "IQAC Approval"],
    [3, "PMSEB", "PMSEB Approval"],
    [4, "COE", "COE Approval"],
    [5, "REGISTRAR", "Registrar Approval"],
    [6, "OFC", "OFC Final Approval"],
  ];
  const clubSteps = [
    [1, "CLUB_AUTHORITY", "Club Authority"],
    [2, "IQAC", "IQAC Approval"],
    [3, "PMSEB", "PMSEB Approval"],
    [4, "COE", "COE Approval"],
    [5, "REGISTRAR", "Registrar Approval"],
    [6, "OFC", "OFC Final Approval"],
  ];
  for (const [order, role, label] of academicSteps) {
    lines.push(
      `INSERT INTO approval_workflow (id, category, "stepOrder", "roleCode", "stepLabel") VALUES ('aw_acad_${order}', 'ACADEMIC', ${order}, '${role}', '${label}') ON CONFLICT (category, "stepOrder") DO UPDATE SET "roleCode" = EXCLUDED."roleCode", "stepLabel" = EXCLUDED."stepLabel";`
    );
  }
  for (const [order, role, label] of clubSteps) {
    lines.push(
      `INSERT INTO approval_workflow (id, category, "stepOrder", "roleCode", "stepLabel") VALUES ('aw_club_${order}', 'CLUB', ${order}, '${role}', '${label}') ON CONFLICT (category, "stepOrder") DO UPDATE SET "roleCode" = EXCLUDED."roleCode", "stepLabel" = EXCLUDED."stepLabel";`
    );
  }

  lines.push("", "-- Workflow templates");
  const templates = [
    { id: "wt_dept", name: "Department — HOD → IQAC → PMSEB → Registrar", category: "ACADEMIC", section: "DEPT", steps: ["HOD", "IQAC", "PMSEB"], isDefault: false },
    { id: "wt_acad_def", name: "Academic — IQAC → PMSEB → Registrar", category: "ACADEMIC", section: null, steps: ["IQAC", "PMSEB"], isDefault: true },
    { id: "wt_gen", name: "Academic — IQAC → Registrar", category: "ACADEMIC", section: "GEN", steps: ["IQAC"], isDefault: false },
    { id: "wt_exo", name: "Academic — PMSEB → Registrar", category: "ACADEMIC", section: "EXO", steps: ["PMSEB"], isDefault: false },
    { id: "wt_hr", name: "HR section — HR → IQAC → PMSEB → COE", category: "ACADEMIC", section: "HR", steps: ["HR", "IQAC", "PMSEB", "COE"], isDefault: false },
    { id: "wt_coe", name: "COE section — COE → IQAC → PMSEB", category: "ACADEMIC", section: "COE", steps: ["COE", "IQAC", "PMSEB"], isDefault: false },
    { id: "wt_club", name: "Club — Club Authority → IQAC → PMSEB → Registrar", category: "CLUB", section: null, steps: ["CLUB_AUTHORITY", "IQAC", "PMSEB"], isDefault: true },
  ];
  for (const t of templates) {
    const section = t.section ? `'${t.section}'` : "NULL";
    lines.push(
      `INSERT INTO workflow_templates (id, name, category, "academicSection", steps, "isDefault") VALUES ('${t.id}', '${esc(t.name)}', '${t.category}', ${section}, ${jsonSteps(t.steps)}, ${t.isDefault}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, steps = EXCLUDED.steps, "isDefault" = EXCLUDED."isDefault";`
    );
  }

  lines.push("", "-- NAAC criteria & metrics");
  for (const criterion of NAAC_CRITERIA_SEED) {
    const cid = `nc_${criterion.number}`;
    lines.push(
      `INSERT INTO naac_criteria (id, number, title, "inputProcessOutcome", "sortOrder") VALUES ('${cid}', ${criterion.number}, '${esc(criterion.title)}', '${criterion.inputProcessOutcome}', ${criterion.number}) ON CONFLICT (number) DO UPDATE SET title = EXCLUDED.title, "inputProcessOutcome" = EXCLUDED."inputProcessOutcome", "isActive" = TRUE;`
    );
    for (const [index, metric] of criterion.metrics.entries()) {
      const mid = `m_${metric.code.replace(".", "_")}`;
      lines.push(
        `INSERT INTO metrics (id, code, title, description, "criterionId", "sortOrder") VALUES ('${mid}', '${metric.code}', '${esc(metric.title)}', '${esc(metric.description)}', '${cid}', ${index}) ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "criterionId" = EXCLUDED."criterionId", "isActive" = TRUE;`
      );
    }
  }

  const sql = lines.join("\n");
  writeFileSync(outPath, sql, "utf8");
  console.log(`Wrote ${outPath} (${lines.length} statements)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
