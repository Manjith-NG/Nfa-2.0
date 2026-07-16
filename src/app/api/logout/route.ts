import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

async function clearAuthCookies(response: NextResponse) {
  const cookieStore = await cookies();
  for (const name of SESSION_COOKIES) {
    cookieStore.delete(name);
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  await clearAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  await clearAuthCookies(response);
  return response;
}
