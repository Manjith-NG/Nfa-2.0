const AUTH_FETCH_TIMEOUT_MS = 90_000;

async function fetchAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Server is waking up (Render cold start). Wait 20–30 seconds, refresh, then sign in again with your Faculty ID."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Client-side sign-in using NextAuth credentials flow (CSRF + callback).
 * Returns a same-origin path to navigate to after the session cookie is set.
 */
export async function signInWithCredentials(
  email: string,
  password: string
): Promise<string> {
  const csrfRes = await fetchAuth("/api/auth/csrf");
  if (!csrfRes.ok) {
    throw new Error(
      "Auth service is unavailable. Stop the dev server and run: npm run dev:clean && npm run dev"
    );
  }

  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfToken) {
    throw new Error("Could not start sign-in. Please refresh and try again.");
  }

  const callbackUrl = `${window.location.origin}/dashboard`;
  const res = await fetchAuth("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email: email.trim().toLowerCase(),
      password,
      callbackUrl,
      json: "true",
    }),
  });

  let data: { error?: string; url?: string } | null = null;
  try {
    data = (await res.json()) as { error?: string; url?: string };
  } catch {
    data = null;
  }

  if (data?.error || (!res.ok && res.status !== 200)) {
    throw new Error(
      data?.error === "CredentialsSignin" || res.status === 401
        ? "Invalid email or password."
        : "Sign in failed. Please try again."
    );
  }

  // Stay on the same host the user opened (avoids localhost vs LAN IP mismatches).
  if (data?.url) {
    try {
      const target = new URL(data.url, window.location.origin);
      if (target.origin === window.location.origin) {
        return `${target.pathname}${target.search}${target.hash}` || "/dashboard";
      }
    } catch {
      // Use default below
    }
  }

  return "/dashboard";
}

/**
 * Signs the user out via NextAuth when available, with a server fallback that
 * clears session cookies directly.
 */
export async function signOutUser(): Promise<void> {
  try {
    const csrfRes = await fetchAuth("/api/auth/csrf");
    if (csrfRes.ok) {
      const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
      if (csrfToken) {
        await fetchAuth("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            csrfToken,
            callbackUrl: "/login",
            json: "true",
          }),
        });
        return;
      }
    }
  } catch {
    // Fall through to cookie-clearing fallback
  }

  await fetchAuth("/api/logout", { method: "POST" });
}
