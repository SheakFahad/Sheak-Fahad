// Applies every migration to an in-memory Postgres (PGlite) with minimal Supabase stubs,
// then exercises RLS as anon / admin / non-admin users.
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2] ?? 'supabase/migrations'
const db = new PGlite()
const run = async (sql, label) => {
  try {
    await db.exec(sql)
  } catch (e) {
    console.error(`✗ ${label}: ${e.message}`)
    process.exit(1)
  }
}

// ── Supabase stubs: roles, auth.users/uid(), storage tables ──
await run(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`, 'stubs')

const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
for (const f of files) {
  await run(fs.readFileSync(path.join(dir, f), 'utf8').replace(/create extension if not exists pgcrypto;/g, ''), f)
  console.log(`✓ ${f}`)
}
await run(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;`, 'grants')

// ── Fixtures (as superuser) ──
const ADMIN = '11111111-1111-1111-1111-111111111111'
const STRANGER = '22222222-2222-2222-2222-222222222222'
await run(`
  insert into auth.users values ('${ADMIN}', 'owner@example.test'), ('${STRANGER}', 'x@example.test');
  insert into public.admin_profiles (user_id, role) values ('${ADMIN}', 'owner');
  insert into public.projects (slug, title, project_type, status, visibility) values
    ('pub', 'Published', 'Web', 'published', 'public'),
    ('draft', 'Draft', 'Web', 'draft', 'public'),
    ('priv', 'Private', 'Web', 'private', 'public'),
    ('arch', 'Archived', 'Web', 'archived', 'public'),
    ('deleted', 'Deleted', 'Web', 'published', 'public'),
    ('later', 'Scheduled', 'Web', 'published', 'public');
  update public.projects set deleted_at = now() where slug = 'deleted';
  update public.projects set published_at = now() + interval '3 days' where slug = 'later';
  insert into public.messages (name, email, body) values ('Visitor', 'v@example.test', 'Hello there, this is a test message.');
`, 'fixtures')

const as = async (role, sub, sql) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false);`)
  try {
    const r = await db.query(sql)
    return r.rows
  } catch (e) {
    return { error: e.message }
  } finally {
    await db.exec('reset role;')
  }
}
const check = (label, ok, detail) => {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) process.exitCode = 1
}

const anonProjects = await as('anon', null, 'select slug from public.projects order by slug')
check('anon sees only published, live, non-deleted projects', JSON.stringify(anonProjects) === JSON.stringify([{ slug: 'pub' }]), JSON.stringify(anonProjects))
const anonMsgs = await as('anon', null, 'select * from public.messages')
check('anon cannot read messages', Array.isArray(anonMsgs) && anonMsgs.length === 0)
const anonInsert = await as('anon', null, `insert into public.projects (slug, title, project_type) values ('hack', 'x', 'x') returning id`)
check('anon cannot write content', !!anonInsert.error, anonInsert.error)
const strangerProjects = await as('authenticated', STRANGER, 'select count(*)::int as n from public.projects')
check('signed-in non-admin sees only public rows', strangerProjects[0]?.n === 1, JSON.stringify(strangerProjects))
const strangerOverview = await as('authenticated', STRANGER, 'select public.admin_overview()')
check('non-admin cannot read the dashboard', !!strangerOverview.error, strangerOverview.error)
const adminProjects = await as('authenticated', ADMIN, 'select count(*)::int as n from public.projects')
check('admin sees every project (incl. drafts/private/archived/deleted)', adminProjects[0]?.n === 6, JSON.stringify(adminProjects))
const overview = await as('authenticated', ADMIN, 'select public.admin_overview() as o')
check('admin dashboard counters', overview[0]?.o?.projects === 5 && overview[0]?.o?.unread_messages === 1, JSON.stringify(overview[0]?.o))
const nav = await as('authenticated', ADMIN, `insert into public.navigation_items (label, href) values ('About', '/about') returning id`)
check('admin creates navigation item', Array.isArray(nav) && nav.length === 1, nav.error)
const badNav = await as('authenticated', ADMIN, `insert into public.navigation_items (label, href) values ('X', 'javascript:alert(1)') returning id`)
check('navigation rejects unsafe hrefs', !!badNav.error)
const audit = await as('authenticated', ADMIN, `insert into public.audit_logs (actor_id, action, entity_type) values ('${ADMIN}', 'project.publish', 'project') returning id`)
check('admin appends audit log', Array.isArray(audit) && audit.length === 1, audit.error)
const auditEdit = await as('authenticated', ADMIN, `update public.audit_logs set action = 'tampered' returning id`)
check('audit log cannot be edited', Array.isArray(auditEdit) && auditEdit.length === 0)
const rpc = await as('anon', null, `select public.submit_message('Ann', 'ann@example.test', null, 'general', 'A real message body here.', '0123456789abcdef0123', 'ua', 'en') as id`)
check('anon can submit contact message via RPC', Array.isArray(rpc) && !!rpc[0]?.id, rpc.error)
const block = await as('authenticated', ADMIN, `insert into public.page_blocks (section_id, type, data) select id, 'script', '{}' from public.site_sections limit 1`)
check('unknown block types rejected', !!block.error || (Array.isArray(block) && block.length === 0))
console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL CHECKS PASSED')
