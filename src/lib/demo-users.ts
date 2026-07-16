import type { RoleCode } from "@prisma/client";
import { DEVELOPER_DEMO_EMAIL, ROLE_LABELS } from "@/lib/constants";
import type { LoginOption } from "@/lib/services/auth-service";

/** Legacy demo password — migrated accounts now use Faculty / Employee ID instead */
export const DEMO_LOGIN_PASSWORD = "password123";

/** Shown when the database is unreachable — matches prisma/seed.ts accounts */
export const FALLBACK_LOGIN_OPTIONS: LoginOption[] = (
  [
    ["faculty.cse@gcu.edu.in", "FACULTY", "FAC001"],
    ["hod.cse@gcu.edu.in", "HOD", "HOD001"],
    ["club.sports@gcu.edu.in", "CLUB_AUTHORITY", "CLUB001"],
    ["iqac@gcu.edu.in", "IQAC", "IQAC001"],
    ["pmseb@gcu.edu.in", "PMSEB", "PMSEB001"],
    ["hr@gcu.edu.in", "HR", "HR001"],
    ["coe@gcu.edu.in", "COE", "COE001"],
    ["registrar@gcu.edu.in", "REGISTRAR", "REG001"],
    ["ofc@gcu.edu.in", "OFC", "OFC001"],
    ["admin@gcu.edu.in", "ADMIN", "ADMIN001"],
    ["developer@gcu.edu.in", "ADMIN", "DEV001"],
  ] as const
).map(([email, roleCode, employeeId]) => ({
  email,
  employeeId,
  roleCode: roleCode as RoleCode,
  roleName: email === DEVELOPER_DEMO_EMAIL ? "Developer" : ROLE_LABELS[roleCode as RoleCode],
  label: email === DEVELOPER_DEMO_EMAIL ? "Developer" : ROLE_LABELS[roleCode as RoleCode],
}));
