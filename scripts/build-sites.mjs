import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// Standard Next.js remains the default runtime. Sites' supported SPA fallback
// serves index.html for new guide paths; StaticRouteFallback resolves the URL.
const hosting = JSON.parse(readFileSync(resolve(".openai/hosting.json"), "utf8"));
if (hosting.static?.not_found_handling !== "single-page-application") {
  throw new Error(
    "Sites requires static.not_found_handling=single-page-application for new guide URLs.",
  );
}
const build = spawnSync(
  process.execPath,
  [resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
  { stdio: "inherit", env: { ...process.env, SITES_STATIC_EXPORT: "1" } },
);
if (build.status !== 0) process.exit(build.status ?? 1);
console.log("Sites export ready: out/ (new guide routes use the SPA fallback).");
