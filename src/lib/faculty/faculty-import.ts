import {
  mapDepartmentCode,
  mapDesignationCode,
  mapPositionCode,
  mapRoleCode,
  parseRepeatedName,
  splitPositionAndPassword,
} from "@/lib/faculty/import-mappings";

export const FACULTY_IMPORT_HEADERS = [
  "employeeId",
  "email",
  "firstName",
  "lastName",
  "phone",
  "departmentCode",
  "designationCode",
  "positionCode",
  "password",
] as const;

/** CSV header aliases — employeeId = faculty ID number */
const HEADER_ALIASES: Record<string, string> = {
  employeeid: "employeeid",
  facultyid: "employeeid",
  faculty_id: "employeeid",
  "faculty id": "employeeid",
  id: "employeeid",
  email: "email",
  firstname: "firstname",
  first_name: "firstname",
  "first name": "firstname",
  lastname: "lastname",
  last_name: "lastname",
  "last name": "lastname",
  phone: "phone",
  mobile: "phone",
  contact: "phone",
  departmentcode: "departmentcode",
  department_code: "departmentcode",
  department: "departmentcode",
  designationcode: "designationcode",
  designation_code: "designationcode",
  designation: "designationcode",
  role: "rolecode",
  rolecode: "rolecode",
  role_code: "rolecode",
  positioncode: "positioncode",
  position_code: "positioncode",
  position: "positioncode",
  password: "password",
};

export type FacultyImportRow = {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentCode: string;
  designationCode?: string;
  positionCode?: string;
  roleCode?: string;
  password?: string;
};

export type FacultyImportRowResult = {
  row: number;
  email: string;
  employeeId?: string;
  success: boolean;
  action?: "created" | "updated";
  error?: string;
};

const SAMPLE_ROW: FacultyImportRow = {
  employeeId: "2004",
  email: "faculty.new@gcu.edu.in",
  firstName: "John",
  lastName: "Doe",
  phone: "9876543210",
  departmentCode: "CS",
  designationCode: "FACULTY",
  positionCode: "ASST_PROFESSOR",
  password: "2004",
};

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function nameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split("@")[0] ?? "faculty";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const firstName = capitalize(parts[0] ?? "Faculty");
  const lastName = capitalize(parts.slice(1).join(" ") || parts[0] || "User");
  return { firstName, lastName };
}

function extractPhone(value?: string): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return undefined;
}

function fixEmailTypos(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[`'"]/g, "")
    .replace(/\.+@/g, "@")
    .replace(/@\./g, "@");
}

/** Match truncated spreadsheet codes (e.g. VICE_CHANCELLO) to seeded master codes. */
export function resolveOrgCode(
  code: string | undefined,
  validCodes: string[]
): string | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  if (validCodes.includes(upper)) return upper;

  const prefixMatches = validCodes.filter(
    (valid) => valid.startsWith(upper) || upper.startsWith(valid)
  );
  if (prefixMatches.length === 1) return prefixMatches[0];

  const fuzzy = validCodes.find((valid) => upper.length >= 4 && valid.includes(upper));
  return fuzzy;
}

/** Clean common spreadsheet issues before import. */
export function normalizeFacultyImportRow(row: FacultyImportRow): FacultyImportRow {
  const email = fixEmailTypos(row.email);
  const employeeId = String(row.employeeId).trim();

  let firstName = row.firstName.trim();
  let lastName = row.lastName.trim();
  let phone = extractPhone(row.phone);
  let designationCode = row.designationCode;
  let positionCode = row.positionCode;
  let password = row.password;
  let roleCode = row.roleCode;

  if (firstName && !firstName.includes("@") && firstName.split(" ").length > 2) {
    const parsed = parseRepeatedName(firstName);
    firstName = parsed.firstName;
    lastName = parsed.lastName;
  }

  if (firstName.includes("@")) {
    const derived = nameFromEmail(email);
    firstName = derived.firstName;
    if (!lastName || lastName.includes("@")) {
      lastName = derived.lastName;
    }
  }

  const phoneInLastName = extractPhone(lastName);
  if (phoneInLastName && !phone) {
    phone = phoneInLastName;
    lastName = lastName.replace(phoneInLastName, "").trim();
  }

  if (!lastName || lastName.includes("@")) {
    lastName = nameFromEmail(email).lastName;
  }

  if (positionCode?.toLowerCase().includes("password")) {
    const split = splitPositionAndPassword(positionCode);
    positionCode = split.positionCode;
    password = password ?? split.password;
  }

  const mappedDept = mapDepartmentCode(row.departmentCode);
  const mappedRole = roleCode ? mapRoleCode(roleCode) : undefined;
  const mappedDesignation = designationCode
    ? mapDesignationCode(designationCode) ?? designationCode.toUpperCase()
    : "FACULTY";
  const mappedPosition = positionCode
    ? mapPositionCode(positionCode) ?? positionCode.toUpperCase()
    : undefined;

  const normalizedPassword =
    password && password.trim() && password.toLowerCase() !== "password123"
      ? password.trim()
      : employeeId;

  return {
    ...row,
    email,
    employeeId,
    firstName,
    lastName,
    phone,
    departmentCode: mappedDept,
    designationCode: mappedDesignation,
    positionCode: mappedPosition,
    roleCode: mappedRole,
    password: normalizedPassword,
  };
}

export function buildFacultyImportTemplateCsv(): string {
  const header = FACULTY_IMPORT_HEADERS.join(",");
  const sample = FACULTY_IMPORT_HEADERS.map((key) => SAMPLE_ROW[key] ?? "").join(",");
  return `${header}\n${sample}\n`;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function resolveHeaderKey(cell: string): string | undefined {
  const normalized = cell.toLowerCase().trim();
  return HEADER_ALIASES[normalized];
}

function parseCompactRow(cells: string[]): FacultyImportRow | null {
  if (cells.length < 4) return null;
  const employeeId = cells[0]?.trim() ?? "";
  if (!/^\d{3,5}$/.test(employeeId)) return null;

  let name = "";
  let email = "";
  let departmentCode = "";
  let roleCode = "FACULTY";
  let positionField = "";
  let password = employeeId;

  if (cells[1]?.includes("@")) {
    email = cells[1];
    departmentCode = cells[2] ?? "";
    roleCode = cells[3] ?? "FACULTY";
    positionField = cells[4] ?? "";
    password = cells[5] ?? employeeId;
  } else {
    name = cells[1] ?? "";
    email = cells[2] ?? "";
    departmentCode = cells[3] ?? "";
    roleCode = cells[4] ?? "FACULTY";
    positionField = cells[5] ?? "";
    password = cells[6] ?? employeeId;
  }

  if (!email.includes("@")) return null;

  const parsedName = name ? parseRepeatedName(name) : nameFromEmail(email);
  const split = splitPositionAndPassword(positionField || password);

  return {
    employeeId,
    email,
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    departmentCode,
    designationCode: roleCode,
    roleCode,
    positionCode: split.positionCode ?? positionField,
    password:
      split.password ??
      (password.toLowerCase().includes("password") ? employeeId : password),
  };
}

function isHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  return joined.includes("employeeid") || joined.includes("email") || joined.includes("department");
}

export function parseFacultyImportCsv(text: string): FacultyImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headerCells = parseCsvLine(lines[0]);
  const headerIndex: Record<string, number> = {};

  headerCells.forEach((cell, index) => {
    const key = resolveHeaderKey(cell);
    if (key && headerIndex[key] === undefined) {
      headerIndex[key] = index;
    }
  });

  const hasStandardHeader =
    headerIndex.employeeid !== undefined &&
    headerIndex.email !== undefined &&
    headerIndex.departmentcode !== undefined;

  if (!hasStandardHeader) {
    const rows: FacultyImportRow[] = [];
    const startIndex = isHeaderRow(headerCells) ? 1 : 0;
    for (let i = startIndex; i < lines.length; i += 1) {
      const cells = parseCsvLine(lines[i]);
      const compact = parseCompactRow(cells);
      if (compact) rows.push(compact);
    }
    if (rows.length > 0) return rows;
    throw new Error("Missing required column: employeeid (faculty ID number), email, departmentcode");
  }

  const rows: FacultyImportRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const get = (key: string) => cells[headerIndex[key]]?.trim() ?? "";

    const employeeId = get("employeeid");
    const email = get("email");
    const firstName = get("firstname") || email.split("@")[0] || "Faculty";
    const lastName = get("lastname") || "User";
    const departmentCode = get("departmentcode");

    if (!employeeId && !email && !departmentCode) {
      continue;
    }

    rows.push({
      employeeId,
      email,
      firstName,
      lastName,
      phone: get("phone") || undefined,
      departmentCode,
      designationCode: get("designationcode") || undefined,
      positionCode: get("positioncode") || undefined,
      roleCode: get("rolecode") || undefined,
      password: get("password") || undefined,
    });
  }

  return rows;
}
