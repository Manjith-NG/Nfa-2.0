import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { getRequestDetailData } from "@/lib/services/request-detail-service";
import { updateRequest } from "@/lib/services/request-service";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
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
  expenditures: z.unknown().optional(),
  receivables: z.unknown().optional(),
  grandTotalExpenditure: z.number().optional(),
  grandTotalReceivable: z.number().optional(),
  budgetDifference: z.number().optional(),
  financialDescription: z.string().optional(),
});

function parseDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await getRequestDetailData(user, id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = updateSchema.parse(await req.json());
    const updated = await updateRequest(user, id, {
      ...body,
      proposalDate: parseDate(body.proposalDate),
      eventStartDate: parseDate(body.eventStartDate),
      eventEndDate: parseDate(body.eventEndDate),
      eventDate: parseDate(body.eventDate),
    });
    return NextResponse.json({ success: true, data: { id: updated.id } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
