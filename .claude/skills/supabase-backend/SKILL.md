---
name: supabase-backend
description: Supabase (Postgres, Auth, Storage, RLS) with Next.js App Router via @supabase/ssr — schema migrations, Row Level Security, admin role checks, SECURITY DEFINER RPCs for public inserts, storage bucket policies, rate limiting, and safe server-only service-role usage. Use for any database, auth, storage, migration, policy, admin-auth or form-submission work.
---

# Supabase backend (Next.js App Router)

Versions (Nov 2026): `@supabase/supabase-js` 2.119.x, `@supabase/ssr` 0.12.x, CLI `supabase` 3.x (`npx supabase ...`). Verify flags with `--help`; don't guess CLI syntax.

## Clients (lib/supabase/)
```ts
// server.ts — Server Components, Route Handlers, Server Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)) } catch {} },
    },
  })
}
// client.ts — browser: createBrowserClient(url, anonKey)
// admin.ts  — import 'server-only'; createClient(url, SERVICE_ROLE_KEY, { auth: { persistSession:false } })
```
Middleware refreshes the session (`supabase.auth.getUser()` in middleware with the same cookie adapter on the response). **Authorize with `getUser()` (validates with the Auth server), not `getSession()`.**

## RLS patterns
```sql
alter table public.projects enable row level security;
alter table public.projects force row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles where user_id = (select auth.uid()));
$$;

create policy "public read published" on public.projects for select to anon, authenticated
  using (status = 'published' and visibility in ('public','unlisted'));
create policy "admin all" on public.projects for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
```
- Wrap `auth.uid()` / `is_admin()` in `(select ...)` so Postgres caches it per statement (performance).
- SECURITY DEFINER functions: always `set search_path = ''` and schema-qualify everything; `revoke execute ... from public` then grant to the roles that need it.
- Never rely on hidden routes; every table has RLS; test as anon, as a non-admin user, as admin.

## Public inserts via RPC (validation + rate limit in one place)
```sql
create function public.submit_message(p_name text, p_email text, p_subject text, p_category public.message_category,
  p_body text, p_ip_hash text, p_ua text, p_locale text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_count int;
begin
  if length(p_name) not between 1 and 100 or length(p_body) not between 10 and 4000
     or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_input'; end if;
  select count(*) into v_count from public.messages where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
  if v_count >= 5 then raise exception 'rate_limited'; end if;
  insert into public.messages(name,email,subject,category,body,ip_hash,user_agent,locale)
  values (p_name,lower(p_email),p_subject,p_category,p_body,p_ip_hash,left(p_ua,300),p_locale) returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.submit_message from public;
grant execute on function public.submit_message to anon, authenticated;
```
The route handler hashes the IP (`sha256(ip + IP_HASH_SALT)`), checks honeypot/time-trap/Turnstile, zod-validates, then calls `supabase.rpc('submit_message', {...})`.

## Storage
- Buckets created in a migration (`insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values (...)`).
- Policies on `storage.objects`: public select by `bucket_id` for public buckets; insert/update/delete `using/with check (bucket_id = 'x' and (select public.is_admin()))`.
- Private buckets → `createSignedUrl(path, 60)` server-side for admins.
- Visitor uploads: server route validates magic bytes + size, re-encodes with `sharp` (strips EXIF/GPS), uploads with the service-role client to a random path.

## Migrations & types
`npx supabase migration new <name>` → edit SQL → `npx supabase db push`. Generate types: `npx supabase gen types typescript --project-id <ref> > lib/database/types.ts`. Seed in `supabase/seed.sql` (idempotent: `on conflict do nothing`).

## Revalidation
After admin mutations: `revalidateTag('projects')` (Next.js). Public queries use `unstable_cache`/fetch tags or `export const revalidate`.

## Gotchas
- Free tier: 50 MB max upload, 1 GB storage, project pauses when inactive.
- Disable public sign-ups for admin-only auth; first admin = dashboard invite + `insert into admin_profiles`.
- Service-role bypasses RLS — never import `admin.ts` in client components; add `server-only`.
- `unlisted` = readable by direct slug but excluded from lists/search/sitemap/AI context (filter in queries).
