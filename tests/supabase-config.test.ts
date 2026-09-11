import test from "node:test";
import assert from "node:assert/strict";
import { readSupabaseConfig } from "../lib/supabase/config";
test("cloud configuration accepts only public keys and never partially falls back", () => {
  assert.equal(readSupabaseConfig(), null);
  assert.throws(() => readSupabaseConfig("https://project.supabase.co"));
  assert.throws(() => readSupabaseConfig("https://project.supabase.co", "sb_secret_never_embed"));
  const secretJwt = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.sig`;
  assert.throws(() => readSupabaseConfig("https://project.supabase.co", secretJwt));
  assert.deepEqual(readSupabaseConfig("https://project.supabase.co", "sb_publishable_test"), {
    url: "https://project.supabase.co",
    key: "sb_publishable_test",
  });
});
