import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import {
  createAcademicSection,
  listActiveAcademicSections,
} from "@/lib/services/academic-section-service";
import { z } from "zod";
import type { RoleCode } from "@prisma/client";

const createSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  entryRole: z.enum(["IQAC", "HOD", "HR", "COE"]).optional(),
});

export async function GET() {
  const sections = await listActiveAcademicSections();
  return NextResponse.json({
    success: true,
    data: sections.map((s) => ({
      id: s.id,
      code: s.code,
      label: s.name,
      name: s.name,
      description: s.description,
      entryRole: s.entryRole,
      routesTo: s.routesTo,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "flow:control")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const section = await createAcademicSection({
      ...parsed,
      entryRole: parsed.entryRole as RoleCode | undefined,
    });
    return NextResponse.json(
      {
        success: true,
        data: {
          id: section.id,
          code: section.code,
          label: section.name,
          name: section.name,
          description: section.description,
          entryRole: section.entryRole,
          routesTo: section.routesTo,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create academic section";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
