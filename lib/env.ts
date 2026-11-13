/**
 * Environment access in one place. Public values are NEXT_PUBLIC_*; everything else is server-only.
 * See docs/ENVIRONMENT_VARIABLES.md.
 */
export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

export const isSupabaseConfigured = () => Boolean(env.supabaseUrl && env.supabaseAnonKey)
