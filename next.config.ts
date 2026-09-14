import type { NextConfig } from "next";
import { readSupabaseConfig } from "./lib/supabase/config";
// Fail before a build can inline a mistakenly supplied privileged key.
const supabaseConfig = readSupabaseConfig(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
if (process.env.REQUIRE_CLOUD_CONFIG === "1" && !supabaseConfig) {
  throw new Error("Canlı yayın için Supabase bağlantı ayarları gerekli.");
}
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1" || process.env.SITES_STATIC_EXPORT === "1"
    ? { output: "export" as const, trailingSlash: true }
    : {}),
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default nextConfig;
