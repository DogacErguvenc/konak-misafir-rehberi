export type PublicRoute =
  { kind: "home" } | { kind: "guide"; slug: string } | { kind: "not-found" };

/** Route the static hosting fallback without treating arbitrary paths as guides. */
export function resolvePublicRoute(pathname: string): PublicRoute {
  if (pathname === "/") return { kind: "home" };
  const match = /^\/rehber\/([^/]+)\/?$/.exec(pathname);
  if (!match) return { kind: "not-found" };

  try {
    const slug = decodeURIComponent(match[1]);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { kind: "not-found" };
    return { kind: "guide", slug };
  } catch {
    return { kind: "not-found" };
  }
}
