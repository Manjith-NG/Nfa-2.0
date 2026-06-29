import type { RoleCode } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import type { LoginOption } from "@/lib/services/auth-service";

/** Default demo password for seeded accounts in the `users` table */
export const DEMO_LOGIN_PASSWORD = "password123";

/** Shown when the database is unreachable — matches prisma/seed.ts accounts */
export const FALLBACK_LOGIN_OPTIONS: LoginOption[] = (
  [
    ["faculty.cse@gcu.edu.in", "FACULTY"],
    ["hod.cse@gcu.edu.in", "HOD"],
    ["club.sports@gcu.edu.in", "CLUB_AUTHORITY"],
    ["iqac@gcu.edu.in", "IQAC"],
    ["pmseb@gcu.edu.in", "PMSEB"],
    ["hr@gcu.edu.in", "HR"],
    ["coe@gcu.edu.in", "COE"],
    ["registrar@gcu.edu.in", "REGISTRAR"],
    ["ofc@gcu.edu.in", "OFC"],
  ] as const
).map(([email, roleCode]) => ({
  email,
  roleCode: roleCode as RoleCode,
  roleName: ROLE_LABELS[roleCode as RoleCode],
  label: ROLE_LABELS[roleCode as RoleCode],
}));
