import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildRequestWhere, createRequest } from "@/lib/services/request-service";
import { fullName } from "@/lib/utils";
import { validateRequestFormFields } from "@/lib/request-validation";
import { z } from "zod";

const lineSchema = z.object({
  particulars: z.string(),
  amount: z.number(),
  quantity: z.number(),
  remarks: z.string().optional(),
});

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(["ACADEMIC", "CLUB"]),
  academicSectionId: z.string().optional(),
  requestTypeId: z.string().optional(),
  clubId: z.string().optional(),
  departmentId: z.string().optional(),
  briefNote: z.string().optional(),
  needForProposal: z.string().optional(),
  proposalDate: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  links: z.string().optional(),
  naacCategory: z.string().optional(),
  metricsCategory: z.string().optional(),
  budgetAmount: z.number().optional(),
  budgetPurpose: z.string().optional(),
  eventDate: z.string().optional(),
  venue: z.string().optional(),
  expenditures: z.array(lineSchema).optional(),
  receivables: z.array(lineSchema).optional(),
  grandTotalExpenditure: z.number().optional(),
  grandTotalReceivable: z.number().optional(),
  budgetDifference: z.number().optional(),
  financialDescription: z.string().optional(),
  submit: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status") as never;
  const category = searchParams.get("category") as never;
  const search = searchParams.get("search") ?? undefined;
  const pendingForMe = searchParams.get("pendingForMe") === "true";
  const mine = searchParams.get("mine") === "true";

  const where = buildRequestWhere(user, {
    status,
    category,
    search,
    pendingForMe,
    mine,
  });

  const skipTotal = searchParams.get("includeTotal") === "false";

  const itemsPromise = prisma.request.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { name: true, code: true } },
      raisedBy: { select: { firstName: true, lastName: true } },
      club: { select: { name: true } },
    },
  });

  const [items, total] = await Promise.all([
    itemsPromise,
    skipTotal ? Promise.resolve(0) : prisma.request.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: items.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        title: r.title,
        category: r.category,
        academicSectionId: r.academicSectionId,
        status: r.status,
        departmentName: r.department.name,
        raisedByName: fullName(r.raisedBy.firstName, r.raisedBy.lastName),
        clubName: r.club?.name,
        currentRoleCode: r.currentRoleCode,
        createdAt: r.createdAt.toISOString(),
        submittedAt: r.submittedAt?.toISOString() ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const validationError = validateRequestFormFields(
      {
        briefNote: parsed.briefNote ?? "",
        needForProposal: parsed.needForProposal ?? "",
        proposalDate: parsed.proposalDate,
        eventStartDate: parsed.eventStartDate,
        eventEndDate: parsed.eventEndDate,
        submit: parsed.submit,
      },
      {
        expenditures: (parsed.expenditures ?? []).map((l) => ({
          id: "",
          particulars: l.particulars,
          amount: String(l.amount),
          quantity: String(l.quantity),
          remarks: l.remarks ?? "",
        })),
        receivables: (parsed.receivables ?? []).map((l) => ({
          id: "",
          particulars: l.particulars,
          amount: String(l.amount),
          quantity: String(l.quantity),
          remarks: l.remarks ?? "",
        })),
      }
    );
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const request = await createRequest(user, {
      ...parsed,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : undefined,
      eventStartDate: parsed.eventStartDate ? new Date(parsed.eventStartDate) : undefined,
      eventEndDate: parsed.eventEndDate ? new Date(parsed.eventEndDate) : undefined,
      eventDate: parsed.eventDate ? new Date(parsed.eventDate) : undefined,
    });
    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
