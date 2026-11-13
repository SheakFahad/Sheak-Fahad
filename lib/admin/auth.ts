import 'server-only'
import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface AdminSession {
  user: User
  role: 'owner' | 'editor'
  name: string
  sb: Awaited<ReturnType<typeof createSupabaseServerClient>>
}

/**
 * The signed-in administrator, or null. `auth.getUser()` re-validates the JWT with Supabase
 * (never trust a cookie alone), then membership is checked in admin_profiles (RLS: own row only).
 */
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) return null
  const sb = await createSupabaseServerClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return null
  const { data } = await sb.from('admin_profiles').select('role, display_name').eq('user_id', user.id).maybeSingle()
  if (!data) return null
  return { user, role: data.role, name: data.display_name || user.email || 'Admin', sb }
})

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}

export async function requireOwner(): Promise<AdminSession> {
  const admin = await requireAdmin()
  if (admin.role !== 'owner') redirect('/admin?error=owner_only')
  return admin
}

/** Append-only audit trail (RLS: actor must be the signed-in admin). Never throws into the caller. */
export async function audit(admin: AdminSession, action: string, entityType: string, entityId?: string | null, summary?: string) {
  await admin.sb
    .from('audit_logs')
    .insert({ actor_id: admin.user.id, actor_email: admin.user.email, action, entity_type: entityType, entity_id: entityId ?? null, summary: summary?.slice(0, 500) ?? null })
    .then(
      () => undefined,
      () => undefined,
    )
}
