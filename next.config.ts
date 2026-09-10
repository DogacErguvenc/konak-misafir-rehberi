import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  ...(process.env.SITES_STATIC_EXPORT === "1"
    ? { output: "export" as const, trailingSlash: true }
    : {}),
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default nextConfig;
