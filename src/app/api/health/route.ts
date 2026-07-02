import { NextResponse } from "next/server";

/** Fast liveness probe for Render — no database (use /api/health/db for DB checks). */
export async function GET() {
  return NextResponse.json({ ok: true, service: "nfa-2.0" });
}
