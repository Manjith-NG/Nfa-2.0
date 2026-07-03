import type { RoleCode } from "@prisma/client";

/** Legacy NFA / spreadsheet department codes → NFA 2.0 department codes */
export const DEPARTMENT_ALIASES: Record<string, string> = {
  CSC: "CS",
  MNG: "MGMT",
  LSC: "LS",
  BPT: "PHY",
  FSC: "FS",
  COM: "COMM",
  COMM: "COMM",
  ELE: "EM",
  IFL: "ENGLISH",
  BHM: "HM",
  RO: "REG_OFF",
  COE_OFF: "EXAM",
  PC: "PHY",
  SNHS: "LS",
  SMC: "COMM",
  SNS: "LS",
  SOL: "LAW",
  SVS: "LS",
  "SVS-H": "LS",
  "SVS-M": "LS",
  SCI: "LS",
  SET: "ENG",
  HOT: "HM",
  BIO: "LS",
  CHE: "LS",
  MAT: "ENG",
  ARCH: "ENG",
  BUS: "COMM",
  HP: "HM",
  PS: "PSY",
  HOD_OFF: "ADMIN",
  OFC_OFF: "ADMIN",
  FINANCE: "ADMIN",
  REGISTRAR_OFF: "REG_OFF",
};

export const DEPARTMENT_NAMES: Record<string, string> = {
  LAW: "Law",
};

const POSITION_ALIASES: Record<string, string> = {
  ASST_PRO: "ASST_PROFESSOR",
  ASST_PROF: "ASST_PROFESSOR",
  ASSOC_PRO: "ASSOC_PROFESSOR",
  PROF: "PROFESSOR",
  REGISTRAR: "REGISTRAR",
  OFC: "ASSISTANT",
  DEAN: "DEAN",
  COE: "COE",
  LIBRARIAN: "LIBRARIAN",
  LECTURER: "LECTURER",
  "SENIOR LECTURER": "SENIOR_LECTURER",
  "TEACHING ASSISTANT": "TEACHING_ASST",
  "ASSISTANT PROFESSOR": "ASST_PROFESSOR",
  "ASSOCIATE PROFESSOR": "ASSOC_PROFESSOR",
  PROFESSOR: "PROFESSOR",
  CHANCELLOR: "CHANCELLOR",
  "VICE CHANCELLOR": "VICE_CHANCELLOR",
  "PRO VICE CHANCELLOR": "PRO_VC",
  "CONTROLLER OF EXAMINATIONS": "COE",
  "CONTROLLER OF EXAMINATION": "COE",
  "DIRECTOR PHYSIOCARE": "DIRECTOR_PHYSIO",
  "PLACEMENT CELL": "PLACEMENT_CELL",
};

const DESIGNATION_FROM_TITLE: Record<string, string> = {
  PROFESSOR: "FACULTY",
  "ASSISTANT PROFESSOR": "FACULTY",
  "ASSOCIATE PROFESSOR": "FACULTY",
  "TEACHING ASSISTANT": "FACULTY",
  ASSISTANT: "FACULTY",
  LECTURER: "FACULTY",
  "SENIOR LECTURER": "FACULTY",
  CHANCELLOR: "CHANCELLOR",
  "VICE CHANCELLOR": "VICE_CHANCELLOR",
  "PRO VICE CHANCELLOR": "PRO_VC",
  REGISTRAR: "REGISTRAR",
  "CONTROLLER OF EXAMINATIONS": "COE",
  "CONTROLLER OF EXAMINATION": "COE",
  DEAN: "DEAN",
  LIBRARIAN: "LIBRARIAN",
  "PLACEMENT CELL": "PMSEB",
  HOD: "HOD",
  IQAC: "IQAC",
  PMSEB: "PMSEB",
};

const ROLE_FROM_LABEL: Record<string, RoleCode> = {
  FACULTY: "FACULTY",
  HOD: "HOD",
  REGISTRAR: "REGISTRAR",
  "CONTROLLER OF EXAMINATION": "COE",
  "CONTROLLER OF EXAMINATIONS": "COE",
  COE: "COE",
  OFC: "OFC",
  IQAC: "IQAC",
  PMSEB: "PMSEB",
  HR: "HR",
  ADMIN: "ADMIN",
  DEAN: "FACULTY",
  CHANCELLOR: "FACULTY",
  "VICE CHANCELLOR": "FACULTY",
  LIBRARIAN: "FACULTY",
  FINANCE: "OFC",
};

export function mapDepartmentCode(code: string): string {
  const upper = code.trim().toUpperCase();
  return DEPARTMENT_ALIASES[upper] ?? upper;
}

export function departmentDisplayName(code: string): string {
  return DEPARTMENT_NAMES[code] ?? code.replace(/_/g, " ");
}

export function mapPositionCode(code?: string): string | undefined {
  if (!code) return undefined;
  const token = code.trim().toUpperCase().split(/\s+/)[0] ?? "";
  if (!token) return undefined;
  if (POSITION_ALIASES[token]) return POSITION_ALIASES[token];
  if (token.startsWith("P1D") || token.startsWith("AEST")) return "ASST_PROFESSOR";
  if (token.startsWith("ASST")) return "ASST_PROFESSOR";
  if (token.startsWith("PROF")) return "PROFESSOR";
  return POSITION_ALIASES[code.trim().toUpperCase()] ?? token;
}

export function mapDesignationCode(label?: string): string | undefined {
  if (!label) return undefined;
  const upper = label.trim().toUpperCase();
  return DESIGNATION_FROM_TITLE[upper] ?? "FACULTY";
}

export function mapPositionFromDesignation(label?: string): string | undefined {
  if (!label) return undefined;
  return mapPositionCode(label);
}

export function mapRoleCode(label?: string): RoleCode {
  if (!label) return "FACULTY";
  const upper = label.trim().toUpperCase();
  return ROLE_FROM_LABEL[upper] ?? "FACULTY";
}

export function splitPositionAndPassword(value?: string): {
  positionCode?: string;
  password?: string;
} {
  if (!value) return {};
  const parts = value.trim().split(/\s+/);
  const password = parts.find((p) => p.toLowerCase() === "password123") ?? undefined;
  const positionToken = parts.find((p) => p.toLowerCase() !== "password123");
  return {
    positionCode: positionToken ? mapPositionCode(positionToken) : undefined,
    password,
  };
}

export function parseRepeatedName(raw: string): { firstName: string; lastName: string } {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  const words = cleaned.split(" ");
  if (words.length >= 3 && words.length % 2 === 1) {
    const half = Math.floor(words.length / 2);
    const first = words.slice(0, half).join(" ");
    const second = words.slice(half).join(" ");
    if (first.toLowerCase() === second.toLowerCase()) {
      const bits = first.split(" ");
      return {
        firstName: titleCase(bits[0] ?? "Faculty"),
        lastName: titleCase(bits.slice(1).join(" ") || bits[0] || "User"),
      };
    }
  }
  const bits = cleaned.split(" ");
  return {
    firstName: titleCase(bits[0] ?? "Faculty"),
    lastName: titleCase(bits.slice(1).join(" ") || bits[0] || "User"),
  };
}

function titleCase(value: string): string {
  if (!value) return value;
  return value
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
