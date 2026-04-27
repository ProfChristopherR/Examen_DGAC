import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://juhhfjgymwqtzwghrltf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PgWj2IXdZUDtYIGjh2XWrg_VKNS_eJ6'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* ─── Auth helpers ─── */

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/Examen_DGAC/mode-select`
        : 'https://profchristopherr.github.io/Examen_DGAC/Examen_DGAC/mode-select',
    },
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
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
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile }, { onConflict: 'id' })
    .select()
    .single()
  return { data, error }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function saveAttempt(attempt: Omit<Attempt, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('attempts')
    .insert(attempt)
    .select()
    .single()
  return { data, error }
}

export async function getAttempts(userId: string) {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data as Attempt[] | null, error }
}

export async function deleteAttempt(attemptId: string) {
  const { error } = await supabase
    .from('attempts')
    .delete()
    .eq('id', attemptId)
  return { error }
}

export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, profiles(name, avatar_url)')
    .eq('type', 'evaluation')
    .order('percentage', { ascending: false })
    .limit(limit)
  return { data, error }
}
