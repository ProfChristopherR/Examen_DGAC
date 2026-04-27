import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://juhhfjgymwqtzwghrltf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PgWj2IXdZUDtYIGjh2XWrg_VKNS_eJ6'

/* ─── Lazy client (safe for SSR/static build) ─── */
let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    // During SSR/static build, return a dummy client that won't be used
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// Backward-compatible export for client-side only
export const supabase = getSupabase()

/* ─── Auth helpers ─── */

export async function signInWithGoogle() {
  const client = getSupabase()
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://profchristopherr.github.io/Examen_DGAC/Examen_DGAC/mode-select',
    },
  })
  return { data, error }
}

export async function signOut() {
  const client = getSupabase()
  const { error } = await client.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const client = getSupabase()
  const { data: { user } } = await client.auth.getUser()
  return user
}

export async function getSession() {
  const client = getSupabase()
  const { data: { session } } = await client.auth.getSession()
  return session
}

/* ─── Database types ─── */

export interface Attempt {
  id: string
  user_id: string
  type: 'practice' | 'evaluation'
  score: number
  total: number
  percentage: number
  grade: string
  answers?: Record<string, string>
  created_at: string
}

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

/* ─── Database helpers ─── */

export async function upsertProfile(userId: string, profile: Partial<Profile>) {
  const client = getSupabase()
  const { data, error } = await client
    .from('profiles')
    .upsert({ id: userId, ...profile }, { onConflict: 'id' })
    .select()
    .single()
  return { data, error }
}

export async function getProfile(userId: string) {
  const client = getSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function saveAttempt(attempt: Omit<Attempt, 'id' | 'created_at'>) {
  const client = getSupabase()
  const { data, error } = await client
    .from('attempts')
    .insert(attempt)
    .select()
    .single()
  return { data, error }
}

export async function getAttempts(userId: string) {
  const client = getSupabase()
  const { data, error } = await client
    .from('attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data as Attempt[] | null, error }
}

export async function deleteAttempt(attemptId: string) {
  const client = getSupabase()
  const { error } = await client
    .from('attempts')
    .delete()
    .eq('id', attemptId)
  return { error }
}

export async function getLeaderboard(limit = 20) {
  const client = getSupabase()
  const { data, error } = await client
    .from('attempts')
    .select('*, profiles(name, avatar_url)')
    .eq('type', 'evaluation')
    .order('percentage', { ascending: false })
    .limit(limit)
  return { data, error }
}
