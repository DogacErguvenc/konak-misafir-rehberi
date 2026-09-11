import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { mockGuide } from "../lib/mock-data";
import { guideSchema, type Guide } from "../lib/types";

const db = new PGlite();
const ownerA = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const ownerB = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
let workspaceA: string;
let workspaceB: string;
let saved: Guide;
async function identity(user: string | null) {
  await db.exec(user ? "set role authenticated" : "set role anon");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ""]);
}
async function scalar<T>(sql: string, values: unknown[] = []) {
  return (await db.query<{ result: T }>(`select ${sql} as result`, values)).rows[0].result;
}
async function save(workspace: string, input: Guide, publish: boolean, importing = false) {
  return guideSchema.parse(
    await scalar("public.save_workspace_guide($1, $2, $3, $4, $5, $6, $7)", [
      workspace,
      input.id,
      input.slug,
      JSON.stringify(input),
      publish,
      importing,
      input.revision ?? 0,
    ]),
  );
}
before(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('${ownerA}'), ('${ownerB}');
  `);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/202609110001_tenant_guidebooks.sql", import.meta.url),
      "utf8",
    ),
  );
  await identity(ownerA);
  workspaceA = (await scalar<{ id: string }>("public.create_workspace($1)", ["Sapanca Evleri"])).id;
  await identity(ownerB);
  workspaceB = (await scalar<{ id: string }>("public.create_workspace($1)", ["Kaş Villaları"])).id;
});
after(async () => {
  await db.close();
});

test("workspace creation is idempotent and each customer sees only their workspace", async () => {
  await identity(ownerA);
  assert.equal(
    (await scalar<{ id: string }>("public.create_workspace($1)", ["Duplicate"])).id,
    workspaceA,
  );
  const workspaces = await scalar<{ id: string }[]>("public.list_workspaces()");
  assert.deepEqual(
    workspaces.map((w) => w.id),
    [workspaceA],
  );
});
test("anonymous visitors cannot enumerate tables or execute host operations", async () => {
  await identity(null);
  for (const table of ["guides", "workspaces", "workspace_members"]) {
    await assert.rejects(db.query(`select * from public.${table}`), { code: "42501" });
  }
  await assert.rejects(scalar("public.list_workspaces()"), { code: "42501" });
  await assert.rejects(scalar("public.create_workspace($1)", ["Unauthorized"]), { code: "42501" });
  for (const signature of [
    "public.save_workspace_guide(uuid,text,text,jsonb,boolean,boolean,integer)",
    "public.unpublish_workspace_guide(uuid,text,integer)",
    "konak_private.validate_guide(jsonb)",
  ]) {
    assert.equal(await scalar("has_function_privilege('anon', $1, 'EXECUTE')", [signature]), false);
  }
});
test("drafts remain private, and an explicit publish returns a valid guest guide", async () => {
  await identity(ownerA);
  saved = await save(
    workspaceA,
    { ...mockGuide, id: "browser-guide-one", slug: "test-bungalov" },
    false,
  );
  assert.equal(saved.publishedAt, null);
  await identity(null);
  assert.equal(await scalar("public.get_published_guide($1)", [saved.slug]), null);
  await identity(ownerA);
  saved = await save(workspaceA, saved, true);
  await identity(null);
  const guest = guideSchema.parse(await scalar("public.get_published_guide($1)", [saved.slug]));
  assert.equal(guest.name, mockGuide.name);
  assert.notEqual(guest.id, saved.id);
  assert.equal("revision" in guest, false);
});
test("customer B cannot read, save, import or unpublish customer A's data", async () => {
  await identity(ownerB);
  await assert.rejects(scalar("public.list_workspace_guides($1)", [workspaceA]), { code: "42501" });
  await assert.rejects(save(workspaceA, saved, true), { code: "42501" });
  await assert.rejects(save(workspaceA, saved, false, true), { code: "42501" });
  await assert.rejects(
    scalar("public.unpublish_workspace_guide($1, $2, $3)", [workspaceA, saved.id, saved.revision]),
    { code: "42501" },
  );
  assert.deepEqual(await scalar("public.list_workspace_guides($1)", [workspaceB]), []);
  await assert.rejects(db.query("select * from public.guides"), { code: "42501" });
});
test("draft edits keep the existing public snapshot and stale writes fail", async () => {
  await identity(ownerA);
  const previous = saved;
  saved = await save(
    workspaceA,
    { ...saved, name: "Yeni ev adı", wifiPassword: "Changed-private-password" },
    false,
  );
  assert.equal(saved.slug, previous.slug);
  await assert.rejects(save(workspaceA, previous, true), { code: "40001" });
  await assert.rejects(
    scalar("public.unpublish_workspace_guide($1, $2, $3)", [
      workspaceA,
      saved.id,
      previous.revision,
    ]),
    { code: "40001" },
  );
  await identity(null);
  const guest = guideSchema.parse(await scalar("public.get_published_guide($1)", [saved.slug]));
  assert.equal(guest.wifiPassword, mockGuide.wifiPassword);
  assert.equal(guest.name, mockGuide.name);
});
test("imports preserve free legacy URLs and never overwrite or duplicate existing cloud records", async () => {
  await identity(ownerA);
  const input = { ...mockGuide, id: "legacy-guide", slug: "sapanca-doga-bungalov-3" };
  const imported = await save(workspaceA, input, false, true);
  assert.equal(imported.slug, input.slug);
  assert.equal(imported.publishedAt, null);
  const updated = await save(workspaceA, { ...imported, name: "Cloud edit" }, true);
  const repeated = await save(workspaceA, input, false, true);
  assert.deepEqual(repeated, updated);
  const list = guideSchema
    .array()
    .parse(await scalar("public.list_workspace_guides($1)", [workspaceA]));
  assert.equal(list.filter((g) => g.id === input.id).length, 1);
  await identity(ownerB);
  const collision = await save(workspaceB, input, false, true);
  assert.notEqual(collision.slug, imported.slug);
});
test("unpublishing removes guest access without deleting the host draft", async () => {
  await identity(ownerA);
  saved = guideSchema.parse(
    await scalar("public.unpublish_workspace_guide($1, $2, $3)", [
      workspaceA,
      saved.id,
      saved.revision,
    ]),
  );
  assert.equal(saved.publishedAt, null);
  assert.equal(saved.wifiPassword, "Changed-private-password");
  await identity(null);
  assert.equal(await scalar("public.get_published_guide($1)", [saved.slug]), null);
  assert.equal(await scalar("public.get_published_guide($1)", ["missing"]), null);
  assert.equal(await scalar("public.get_published_guide($1)", [null]), null);
});
test("malformed direct RPC payloads are rejected without corrupting the workspace", async () => {
  await identity(ownerA);
  for (const invalid of [
    { coverImage: "https://" },
    { address: "     " },
    { wifiName: " " },
    { coverImage: "javascript:alert(1)" },
    { coverImage: "https://example.com:99999" },
  ]) {
    await assert.rejects(save(workspaceA, { ...saved, ...invalid }, true), { code: "22023" });
  }
  const list = guideSchema
    .array()
    .parse(await scalar("public.list_workspace_guides($1)", [workspaceA]));
  assert.equal(list.find((g) => g.id === saved.id)?.revision, saved.revision);
});
