import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Service-role client — bypasses RLS. ONLY for trusted server code that cannot run as the user:
 * contact-form pipeline, email logs, seeding. Never import from a client component; never expose the key.
 */
export function createSupabaseServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!env.supabaseUrl || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  return createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
