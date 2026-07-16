import { prisma } from "@/lib/db";

export async function getUserClubIds(userId: string): Promise<string[]> {
  const rows = await prisma.clubAuthority.findMany({
    where: { userId, isActive: true },
    select: { clubId: true },
  });
  return rows.map((row) => row.clubId);
}

export async function userHasClubAccess(
  userId: string,
  clubId: string | null | undefined
): Promise<boolean> {
  if (!clubId) return false;
  const count = await prisma.clubAuthority.count({
    where: { userId, clubId, isActive: true },
  });
  return count > 0;
}
