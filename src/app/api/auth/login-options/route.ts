import { NextResponse } from "next/server";
import { FALLBACK_LOGIN_OPTIONS } from "@/lib/demo-users";
import { getLoginOptions } from "@/lib/services/auth-service";

const DB_SETUP_HINT =
  "Database not connected. Run: npm run setup:env YOUR_SUPABASE_DATABASE_PASSWORD then npm run db:seed";

/** Public list of demo login accounts sourced from the `users` table. */
export async function GET() {
  try {
    const data = await getLoginOptions();
    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        data: FALLBACK_LOGIN_OPTIONS,
        warning: "No users in database. Run: npm run db:seed",
      });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("login-options:", error);
    return NextResponse.json({
      success: true,
      data: FALLBACK_LOGIN_OPTIONS,
      warning: DB_SETUP_HINT,
    });
  }
}
