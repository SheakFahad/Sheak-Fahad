'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.email().max(200), password: z.string().min(8).max(200) })

export interface LoginState {
  error: string | null
}

/** Email + password sign-in. Generic errors only (no account enumeration). Non-admins are signed out again. */
export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured()) return { error: 'The database is not connected yet.' }
  const parsed = schema.safeParse({ email: form.get('email'), password: form.get('password') })
  if (!parsed.success) return { error: 'Enter a valid email and password.' }

  const sb = await createSupabaseServerClient()
  const { data, error } = await sb.auth.signInWithPassword(parsed.data)
  if (error || !data.user) return { error: 'Email or password is incorrect.' }

  const { data: profile } = await sb.from('admin_profiles').select('user_id').eq('user_id', data.user.id).maybeSingle()
  if (!profile) {
    await sb.auth.signOut()
    return { error: 'This account does not have admin access.' }
  }
  await sb.from('audit_logs').insert({ actor_id: data.user.id, actor_email: data.user.email, action: 'auth.login', entity_type: 'session' })
  redirect('/admin')
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient()
    await sb.auth.signOut()
  }
  redirect('/admin/login')
}
