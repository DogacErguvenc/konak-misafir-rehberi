export function readSupabaseConfig(url?: string, key?: string) {
  if (!url && !key) return null;
  if (!url || !key) throw new Error("Supabase bağlantı ayarları eksik.");
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))
  ) {
    throw new Error("Supabase bağlantısı HTTPS kullanmalı.");
  }
  // Only public keys belong in a browser bundle. Reject accidental privileged keys.
  if (!key.startsWith("sb_publishable_")) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role !== "anon") throw new Error();
    } catch {
      throw new Error("Yalnızca Supabase publishable veya anon anahtarı kullanılabilir.");
    }
  }
  return { url: parsed.origin, key };
}

export function getSupabaseConfig() {
  return readSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isCloudConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
