import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getDashboardStats } from "@/lib/services/dashboard-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getDashboardStats(user);

  return NextResponse.json({
    success: true,
    data,
  });
}
