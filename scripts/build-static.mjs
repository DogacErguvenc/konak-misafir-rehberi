import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// A portable Next.js export: no hosting account or platform manifest is read.
const build = spawnSync(
  process.execPath,
  [resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "1",
      ...(process.argv.includes("--cloud") ? { REQUIRE_CLOUD_CONFIG: "1" } : {}),
    },
  },
);
if (build.status !== 0) process.exit(build.status ?? 1);
for (const page of ["index.html", "dashboard/index.html", "sifre-yenile/index.html"]) {
  if (!existsSync(resolve("out", page))) {
    throw new Error(`Eksik statik sayfa: ${page}`);
  }
}
console.log("Bağımsız statik yayın hazır: out/");
