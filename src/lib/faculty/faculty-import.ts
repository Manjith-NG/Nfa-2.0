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

export type FacultyImportRow = {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentCode: string;
  designationCode?: string;
  positionCode?: string;
  password?: string;
};

export type FacultyImportRowResult = {
  row: number;
  email: string;
  success: boolean;
  error?: string;
};

const SAMPLE_ROW: FacultyImportRow = {
  employeeId: "EMP101",
  email: "faculty.new@gcu.edu.in",
  firstName: "John",
  lastName: "Doe",
  phone: "9876543210",
  departmentCode: "CS",
  designationCode: "FACULTY",
  positionCode: "ASST_PROFESSOR",
  password: "password123",
};

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

export function parseFacultyImportCsv(text: string): FacultyImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const headerIndex = Object.fromEntries(headerCells.map((cell, index) => [cell, index]));

  const required = ["employeeid", "email", "firstname", "lastname", "departmentcode"];
  for (const key of required) {
    if (headerIndex[key] === undefined) {
      throw new Error(`Missing required column: ${key}`);
    }
  }

  const rows: FacultyImportRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const get = (key: string) => cells[headerIndex[key]]?.trim() ?? "";

    const employeeId = get("employeeid");
    const email = get("email");
    const firstName = get("firstname");
    const lastName = get("lastname");
    const departmentCode = get("departmentcode");

    if (!employeeId && !email && !firstName && !lastName && !departmentCode) {
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
      password: get("password") || undefined,
    });
  }

  return rows;
}
