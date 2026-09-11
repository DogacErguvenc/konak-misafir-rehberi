-- Run once in the Supabase SQL Editor. No service-role key is needed by the app.
begin;

create schema if not exists konak_private;
revoke all on schema konak_private from public;
grant usage on schema konak_private to anon, authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id text not null check (char_length(source_id) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160 and slug <> 'sapanca-doga-3'),
  draft_data jsonb not null,
  published_data jsonb,
  published_at timestamptz,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  unique (workspace_id, source_id),
  check ((published_data is null) = (published_at is null))
);

-- All browser table access is denied, including anonymous enumeration.
-- Mutations and reads pass through the narrow, authorized RPCs below.
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.guides enable row level security;
revoke all on public.workspaces, public.workspace_members, public.guides from anon, authenticated;

create function konak_private.require_member(p_workspace_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
  ) then raise exception 'Not authorized' using errcode = '42501'; end if;
end;
$$;

create function konak_private.guide_document(g public.guides) returns jsonb
language sql stable set search_path = '' as $$
  select g.draft_data || jsonb_build_object('id', g.source_id, 'slug', g.slug,
    'updatedAt', g.updated_at, 'publishedAt', g.published_at, 'revision', g.revision);
$$;

create function konak_private.valid_http_url(value text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare parts text[]; host text; port text;
begin
  if value is null or char_length(value) > 4096 or value ~ '[[:space:]\\]' then return false; end if;
  parts := regexp_match(value, '^https?://([^/?#]+)([/?#].*)?$');
  if parts is null then return false; end if;
  host := parts[1];
  -- Ordinary DNS hosts and optional valid ports; reject credentials and malformed authority.
  if host !~ '^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?(:[0-9]{1,5})?$' then return false; end if;
  if position(':' in host) > 0 then
    port := split_part(host, ':', 2);
    if port::integer > 65535 then return false; end if;
    host := split_part(host, ':', 1);
  end if;
  if host ~ '^[0-9.]+$' then
    if host !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$' then return false; end if;
    foreach port in array string_to_array(host, '.') loop
      if port::integer > 255 then return false; end if;
    end loop;
  end if;
  return true;
end;
$$;

create function konak_private.validate_guide(p jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare item jsonb; key text; cleaned jsonb := '{}'::jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' or octet_length(p::text) > 150000 then
    raise exception 'Invalid guide' using errcode = '22023';
  end if;
  foreach key in array array['name','coverImage','address','location','mapsUrl','wifiName','wifiPassword','whatsapp','checkIn','checkOut'] loop
    if jsonb_typeof(p->key) is distinct from 'string' then raise exception 'Invalid field' using errcode = '22023'; end if;
    cleaned := cleaned || jsonb_build_object(key, p->key);
  end loop;
  if char_length(btrim(p->>'name')) not between 3 and 100
    or char_length(btrim(p->>'address')) not between 5 and 300
    or char_length(p->>'location') > 100
    or char_length(btrim(p->>'wifiName')) not between 1 and 100
    or char_length(p->>'wifiPassword') not between 1 and 100
    or char_length(regexp_replace(p->>'whatsapp', '[^0-9]', '', 'g')) not between 10 and 15
    or p->>'whatsapp' !~ '^[+0-9 ()-]+$'
    or not konak_private.valid_http_url(p->>'coverImage')
    or (p->>'mapsUrl' <> '' and not konak_private.valid_http_url(p->>'mapsUrl'))
    or char_length(p->>'checkIn') > 50 or char_length(p->>'checkOut') > 50 then
    raise exception 'Invalid guide field' using errcode = '22023';
  end if;
  foreach key in array array['instructions','places'] loop
    if jsonb_typeof(p->key) is distinct from 'array' or jsonb_array_length(p->key) > 20 then
      raise exception 'Invalid list' using errcode = '22023';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(p->'instructions') loop
    if jsonb_typeof(item->'id') is distinct from 'string'
      or jsonb_typeof(item->'title') is distinct from 'string'
      or jsonb_typeof(item->'description') is distinct from 'string'
      or char_length(btrim(item->>'title')) not between 2 and 100
      or char_length(btrim(item->>'description')) not between 5 and 4000 then
      raise exception 'Invalid instruction' using errcode = '22023';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(p->'places') loop
    foreach key in array array['id','name','category','distance','mapsUrl','imageUrl'] loop
      if jsonb_typeof(item->key) is distinct from 'string' then raise exception 'Invalid place' using errcode = '22023'; end if;
    end loop;
    if char_length(btrim(item->>'name')) not between 2 and 100
      or char_length(btrim(item->>'distance')) not between 1 and 40
      or item->>'category' not in ('market','pharmacy','restaurant','nature')
      or not konak_private.valid_http_url(item->>'mapsUrl')
      or (item->>'imageUrl' <> '' and not konak_private.valid_http_url(item->>'imageUrl')) then
      raise exception 'Invalid place' using errcode = '22023';
    end if;
  end loop;
  return cleaned || jsonb_build_object('instructions', p->'instructions', 'places', p->'places');
end;
$$;

create function konak_private.list_workspaces() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'name', w.name, 'role', m.role) order by w.created_at)
    from public.workspaces w join public.workspace_members m on m.workspace_id = w.id
    where m.user_id = auth.uid()), '[]'::jsonb);
end;
$$;
create function konak_private.create_workspace(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w public.workspaces;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100 then raise exception 'Invalid name' using errcode = '22023'; end if;
  insert into public.workspaces(owner_id, name) values (auth.uid(), btrim(p_name))
    on conflict (owner_id) do update set owner_id = excluded.owner_id returning * into w;
  insert into public.workspace_members(workspace_id, user_id, role) values(w.id, auth.uid(), 'owner') on conflict do nothing;
  return jsonb_build_object('id', w.id, 'name', w.name, 'role', 'owner');
end;
$$;
create function konak_private.list_workspace_guides(p_workspace_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform konak_private.require_member(p_workspace_id);
  return coalesce((select jsonb_agg(konak_private.guide_document(g) order by g.updated_at desc)
    from public.guides g where g.workspace_id = p_workspace_id), '[]'::jsonb);
end;
$$;
create function konak_private.save_workspace_guide(
  p_workspace_id uuid, p_source_id text, p_slug text, p_data jsonb,
  p_publish boolean, p_import boolean, p_revision integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.guides; clean jsonb; candidate text; attempt integer;
begin
  perform konak_private.require_member(p_workspace_id);
  if p_source_id is null or char_length(p_source_id) not between 1 and 160
    or p_publish is null or p_import is null or p_revision is null then
    raise exception 'Invalid request' using errcode = '22023'; end if;
  -- Serializes creation and repeated imports of the same browser record.
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || '/' || p_source_id, 0));
  select * into g from public.guides where workspace_id = p_workspace_id and source_id = p_source_id for update;
  if found then
    if p_import then return konak_private.guide_document(g); end if;
    if p_revision <> g.revision then raise exception 'Stale revision' using errcode = '40001'; end if;
    clean := konak_private.validate_guide(p_data);
    update public.guides set draft_data = clean,
      published_data = case when p_publish then clean else published_data end,
      published_at = case when p_publish then clock_timestamp() else published_at end,
      updated_at = clock_timestamp(), revision = revision + 1
      where id = g.id returning * into g;
    return konak_private.guide_document(g);
  end if;
  clean := konak_private.validate_guide(p_data);
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_slug) > 130 then
    raise exception 'Invalid slug' using errcode = '22023'; end if;
  -- Imported legacy links keep their slug when available. New links get a random suffix.
  for attempt in 0..20 loop
    candidate := case when p_import and attempt = 0 and p_slug <> 'sapanca-doga-3' then p_slug
      else p_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) end;
    insert into public.guides(workspace_id, source_id, slug, draft_data, published_data, published_at)
      values (p_workspace_id, p_source_id, candidate, clean,
        case when p_publish and not p_import then clean else null end,
        case when p_publish and not p_import then clock_timestamp() else null end)
      on conflict (slug) do nothing returning * into g;
    if found then return konak_private.guide_document(g); end if;
  end loop;
  raise exception 'Could not allocate link' using errcode = '23505';
end;
$$;
create function konak_private.unpublish_workspace_guide(p_workspace_id uuid, p_source_id text, p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.guides;
begin
  perform konak_private.require_member(p_workspace_id);
  select * into g from public.guides where workspace_id = p_workspace_id and source_id = p_source_id for update;
  if not found then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_revision is distinct from g.revision then raise exception 'Stale revision' using errcode = '40001'; end if;
  update public.guides set published_data = null, published_at = null, revision = revision + 1, updated_at = clock_timestamp()
    where id = g.id returning * into g;
  return konak_private.guide_document(g);
end;
$$;
create function konak_private.get_published_guide(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select g.published_data || jsonb_build_object('id', g.id, 'slug', g.slug, 'updatedAt', g.published_at)
    from public.guides g where g.slug = p_slug and g.published_data is not null;
$$;

-- Only these wrappers are exposed through the Supabase Data API (public schema).
create function public.list_workspaces() returns jsonb language sql security invoker set search_path = '' as $$ select konak_private.list_workspaces(); $$;
create function public.create_workspace(p_name text) returns jsonb language sql security invoker set search_path = '' as $$ select konak_private.create_workspace(p_name); $$;
create function public.list_workspace_guides(p_workspace_id uuid) returns jsonb language sql security invoker set search_path = '' as $$ select konak_private.list_workspace_guides(p_workspace_id); $$;
create function public.save_workspace_guide(p_workspace_id uuid, p_source_id text, p_slug text, p_data jsonb, p_publish boolean, p_import boolean, p_revision integer)
returns jsonb language sql security invoker set search_path = '' as $$ select konak_private.save_workspace_guide(p_workspace_id, p_source_id, p_slug, p_data, p_publish, p_import, p_revision); $$;
create function public.unpublish_workspace_guide(p_workspace_id uuid, p_source_id text, p_revision integer)
returns jsonb language sql security invoker set search_path = '' as $$ select konak_private.unpublish_workspace_guide(p_workspace_id, p_source_id, p_revision); $$;
create function public.get_published_guide(p_slug text) returns jsonb language sql stable security invoker set search_path = '' as $$ select konak_private.get_published_guide(p_slug); $$;

revoke all on all functions in schema konak_private from public, anon, authenticated;
revoke all on function public.list_workspaces(), public.create_workspace(text), public.list_workspace_guides(uuid),
  public.save_workspace_guide(uuid,text,text,jsonb,boolean,boolean,integer), public.unpublish_workspace_guide(uuid,text,integer), public.get_published_guide(text) from public, anon, authenticated;
grant execute on function konak_private.list_workspaces(), konak_private.create_workspace(text), konak_private.list_workspace_guides(uuid),
  konak_private.save_workspace_guide(uuid,text,text,jsonb,boolean,boolean,integer), konak_private.unpublish_workspace_guide(uuid,text,integer) to authenticated;
grant execute on function public.list_workspaces(), public.create_workspace(text), public.list_workspace_guides(uuid),
  public.save_workspace_guide(uuid,text,text,jsonb,boolean,boolean,integer), public.unpublish_workspace_guide(uuid,text,integer) to authenticated;
grant execute on function konak_private.get_published_guide(text), public.get_published_guide(text) to anon, authenticated;

commit;
