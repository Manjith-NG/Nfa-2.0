import { prisma } from "@/lib/db";
import { CLUB_SECTIONS } from "@/lib/club-sections";

/** Ensure every known club section exists in the database, then return active clubs. */
export async function listActiveClubs() {
  await Promise.all(
    CLUB_SECTIONS.map((club) =>
      prisma.club.upsert({
        where: { code: club.code },
        create: { code: club.code, name: club.label, isActive: true },
        update: { name: club.label, isActive: true },
      })
    )
  );

  return prisma.club.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function createClub(data: { code: string; name: string }) {
  const code = data.code.trim().toUpperCase().replace(/\s+/g, "_");
  const name = data.name.trim();

  if (!code || code.length < 2) {
    throw new Error("Club code must be at least 2 characters");
  }
  if (!name) {
    throw new Error("Club name is required");
  }

  const existing = await prisma.club.findUnique({ where: { code } });
  if (existing) {
    throw new Error("A club with this code already exists");
  }

  return prisma.club.create({
    data: { code, name, isActive: true },
    select: { id: true, code: true, name: true },
  });
}
