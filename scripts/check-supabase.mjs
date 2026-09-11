import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error(
    "Supabase bağlantısı eksik. .env.local içindeki iki NEXT_PUBLIC_SUPABASE alanını doldurun. Ayrıntılar: docs/supabase-setup.md",
  );
  process.exit(1);
}
if (!key.startsWith("sb_publishable_")) {
  let role;
  try {
    role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
  } catch {}
  if (role !== "anon") {
    console.error("Yalnızca publishable veya anon anahtarı kullanın.");
    process.exit(1);
  }
}
const headers = { apikey: key, "Content-Type": "application/json" };
async function request(path, options = {}) {
  return fetch(new URL(path, url), { ...options, headers, signal: AbortSignal.timeout(15000) });
}
try {
  const auth = await request("/auth/v1/settings");
  if (!auth.ok) throw new Error("Auth servisine ulaşılamadı veya bağlantı anahtarı geçersiz.");
  const guide = await request("/rest/v1/rpc/get_published_guide", {
    method: "POST",
    body: JSON.stringify({ p_slug: "konak-connection-check-nonexistent" }),
  });
  if (!guide.ok || (await guide.json()) !== null)
    throw new Error("Rehber sorgusu doğrulanamadı. SQL kurulumunu kontrol edin.");
  for (const table of ["guides", "workspaces", "workspace_members"]) {
    const response = await request(`/rest/v1/${table}?select=*&limit=1`);
    if (![401, 403].includes(response.status))
      throw new Error(`${table}: anonim erişim kısıtlaması doğrulanamadı.`);
  }
  console.log(
    "Bağlantı hazır: Auth erişimi, rehber sorgusu ve anonim tablo erişim kısıtlamaları doğrulandı.",
  );
  console.log("Sonraki kontrol: iki gerçek hesap, doğrulama e-postası ve oturumsuz QR erişimi.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Bağlantı kontrolü başarısız.");
  process.exitCode = 1;
}
