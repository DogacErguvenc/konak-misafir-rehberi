import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let client: SupabaseClient | undefined;
export function getSupabaseClient() {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) throw new Error("Hesap sistemi henüz bağlanmadı.");
  client = createClient(config.url, config.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  });
  return client;
}
