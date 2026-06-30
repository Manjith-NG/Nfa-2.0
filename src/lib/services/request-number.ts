import { prisma } from "@/lib/db";
import type { RequestCategory } from "@prisma/client";

function formatRefDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  return `${day}-${mon}-${d.getFullYear()}`;
}

export async function generateRequestNumber(options: {
  category: RequestCategory;
  departmentCode: string;
  academicSectionCode?: string | null;
  clubCode?: string | null;
}): Promise<string> {
  const now = new Date();
  const datePart = formatRefDate(now);

  const sectionPart =
    options.category === "CLUB" && options.clubCode
      ? `CLUB-${options.clubCode}`
      : options.academicSectionCode ?? options.departmentCode;

  const prefix = `GCU/${sectionPart}/${datePart}/`;
  const existing = await prisma.request.count({
    where: { requestNumber: { startsWith: prefix } },
  });

  const seq = String(existing + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}
