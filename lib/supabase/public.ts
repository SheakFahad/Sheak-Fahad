import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Anonymous, cookie-less client for public page rendering: reads only what RLS allows `anon`
 * (published, public, live rows). Safe to use in cached / static rendering.
 */
export function createSupabasePublicClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { tags: ['cms'] } }) },
  })
}
