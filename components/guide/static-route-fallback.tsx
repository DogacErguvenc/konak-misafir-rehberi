"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GuestLoader } from "@/components/guide/guest-loader";
import { PageNotFound } from "@/components/page-not-found";
import { resolvePublicRoute, type PublicRoute } from "@/lib/public-route";

/**
 * Sites serves index.html for paths created after the static export.
 * Read the browser URL after hydration, since the exported Next router tree
 * still describes the homepage. Also recover guide links on 404-page hosts.
 */
export function StaticRouteFallback({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [route, setRoute] = useState<PublicRoute | null>(null);

  useEffect(() => {
    function syncRoute() {
      setRoute(resolvePublicRoute(window.location.pathname));
    }
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [pathname]);

  if (route?.kind === "guide") return <GuestLoader key={route.slug} slug={route.slug} />;
  if (route?.kind === "not-found") return <PageNotFound />;
  return <>{children}</>;
}
