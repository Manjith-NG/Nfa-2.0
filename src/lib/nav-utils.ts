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
