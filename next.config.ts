import type { NextConfig } from "next";
import { readSupabaseConfig } from "./lib/supabase/config";
// Fail before a build can inline a mistakenly supplied privileged key.
readSupabaseConfig(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const nextConfig: NextConfig = {
  ...(process.env.SITES_STATIC_EXPORT === "1"
    ? { output: "export" as const, trailingSlash: true }
    : {}),
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default nextConfig;
