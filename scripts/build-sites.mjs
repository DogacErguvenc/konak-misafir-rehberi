import { spawnSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
// Standard Next.js remains the default runtime. Sites uses a static guest shell
// with a Cloudflare rewrite for browser-local slugs created after the export.
const build = spawnSync(
  process.execPath,
  [resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
  { stdio: "inherit", env: { ...process.env, SITES_STATIC_EXPORT: "1" } },
);
if (build.status !== 0) process.exit(build.status ?? 1);
copyFileSync(resolve("out/rehber/sapanca-doga-3/index.html"), resolve("out/guest-shell.html"));
writeFileSync(resolve("out/_redirects"), "/rehber/* /guest-shell.html 200\n", "utf8");
console.log("Sites export ready: out/ (guest route rewrite included).");
