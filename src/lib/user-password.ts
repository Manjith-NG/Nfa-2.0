import bcrypt from "bcryptjs";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";

export async function resolveLoginPassword(
  passwordHash: string,
  passwordHint: string | null | undefined
): Promise<string | null> {
  if (passwordHint) return passwordHint;
  const isDefault = await bcrypt.compare(DEMO_LOGIN_PASSWORD, passwordHash);
  return isDefault ? DEMO_LOGIN_PASSWORD : null;
}

export function passwordHintFromPlaintext(password: string): string {
  return password;
}
