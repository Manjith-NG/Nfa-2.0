import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { submitDraftRequest } from "@/lib/services/request-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const request = await submitDraftRequest(user, id);
    return NextResponse.json({ success: true, data: { id: request.id, status: request.status } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
