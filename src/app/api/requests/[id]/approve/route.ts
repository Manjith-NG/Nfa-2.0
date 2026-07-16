import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { processApproval } from "@/lib/services/request-service";
import { validateApprovalRemarks } from "@/lib/request-validation";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "RESEND"]),
  remarks: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, remarks } = schema.parse(body);

    const remarksError = validateApprovalRemarks(remarks);
    if (remarksError) {
      return NextResponse.json({ success: false, error: remarksError }, { status: 400 });
    }

    const updated = await processApproval(user, id, action, remarks);
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Approval failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
