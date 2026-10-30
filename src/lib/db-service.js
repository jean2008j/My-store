import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════
// DEMO MODE — forced off. No real database connection.
// All data lives in the browser (Zustand + localStorage + seed).
// Admin PIN: OWL-2026
// To re-enable Supabase later: set FORCE_DEMO = false and add
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env
// ═══════════════════════════════════════════════════════════════
const FORCE_DEMO = true

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = FORCE_DEMO
  ? false
  : Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'))

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
