import { StaticRouteFallback } from "@/components/guide/static-route-fallback";
import { PageNotFound } from "@/components/page-not-found";
export default function NotFound() {
  return (
    <StaticRouteFallback>
      <PageNotFound />
    </StaticRouteFallback>
  );
}
