import bcrypt from "bcryptjs";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";

/** Default login password for a user is their Faculty / Employee ID. */
export function defaultPasswordForEmployeeId(employeeId: string): string {
  return employeeId.trim();
}

export async function resolveLoginPassword(
  passwordHash: string,
  passwordHint: string | null | undefined,
  employeeId?: string | null
): Promise<string | null> {
  if (passwordHint) {
    const hintMatches = await bcrypt.compare(passwordHint, passwordHash);
    if (hintMatches) return passwordHint;
  }

  const facultyId = employeeId?.trim();
  if (facultyId) {
    const isFacultyId = await bcrypt.compare(facultyId, passwordHash);
    if (isFacultyId) return facultyId;
  }

  const isLegacyDefault = await bcrypt.compare(DEMO_LOGIN_PASSWORD, passwordHash);
  return isLegacyDefault ? DEMO_LOGIN_PASSWORD : null;
}

export function passwordHintFromPlaintext(password: string): string {
  return password;
}

export async function hashLoginPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
