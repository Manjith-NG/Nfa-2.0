/**
 * Resolves a sensible back link for the current app route.
 * Top-level sections return to dashboard; nested routes return to their parent path.
 */
export function getBackHref(pathname: string): string | null {
  const path = pathname.split("?")[0];
  if (path === "/dashboard") return null;

  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 1) return "/dashboard";

  return `/${segments.slice(0, -1).join("/")}`;
}

export function getBackLabel(pathname: string): string {
  const href = getBackHref(pathname);
  if (!href) return "Back";

  if (href === "/dashboard") return "Dashboard";

  const segment = href.split("/").filter(Boolean).pop() ?? "page";
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Picks the most specific nav href that matches the current path
 * (e.g. /requests/new wins over /requests).
 */
export function getActiveNavHref(
  pathname: string,
  hrefs: string[]
): string | null {
  const matches = hrefs.filter((href) => {
    const base = href.split("?")[0];
    if (pathname === base) return true;
    if (base === "/dashboard") return false;
    return pathname.startsWith(`${base}/`);
  });

  if (matches.length === 0) return null;

  return matches.sort((a, b) => b.split("?")[0].length - a.split("?")[0].length)[0] ?? null;
}

export function isNavItemActive(pathname: string, href: string, allHrefs: string[]): boolean {
  return getActiveNavHref(pathname, allHrefs) === href;
}
