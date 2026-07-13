import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEMO_LOGIN_PASSWORD } from "@/lib/demo-users";
import { defaultPasswordForEmployeeId } from "@/lib/user-password";

export type PasswordMigrationResult = {
  scanned: number;
  updated: number;
  skipped: number;
};

/**
 * Force every account still using password123 onto Faculty / Employee ID.
 * Users who already changed their password (hash no longer password123) are left alone.
 */
export async function migrateLegacyPasswordsToFacultyId(): Promise<PasswordMigrationResult> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      employeeId: true,
      passwordHash: true,
      passwordHint: true,
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const facultyId = defaultPasswordForEmployeeId(user.employeeId);
    if (!facultyId) {
      skipped += 1;
      continue;
    }

    const hashIsLegacy = await bcrypt.compare(DEMO_LOGIN_PASSWORD, user.passwordHash);

    if (hashIsLegacy) {
      const passwordHash = await bcrypt.hash(facultyId, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordHint: facultyId },
      });
      updated += 1;
      continue;
    }

    const hashIsFacultyId = await bcrypt.compare(facultyId, user.passwordHash);
    if (hashIsFacultyId) {
      if (user.passwordHint !== facultyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHint: facultyId },
        });
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    // Custom password — clear stale password123 hint so developer UI does not lie
    if (user.passwordHint === DEMO_LOGIN_PASSWORD) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHint: null },
      });
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  return { scanned: users.length, updated, skipped };
}
