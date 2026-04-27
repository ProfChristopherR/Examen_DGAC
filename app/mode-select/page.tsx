'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ClipboardCheck, Plane, ArrowLeft, History, Trash2, Trophy, AlertCircle, User, ChevronRight, RotateCcw, Crown, FlaskConical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupabase, signOut, getAttempts, deleteAttempt, getLeaderboard } from '@/lib/supabase'
import type { Attempt } from '@/lib/supabase'
import { loadPracticeProgress, clearEvalStorage } from '@/lib/storage'

interface LocalUser {
  id: string
  name: string
  email: string
  provider: 'local' | 'google'
}

export default function ModeSelect() {
  const router = useRouter()
  const [user, setUser] = useState<LocalUser | null>(null)
  const [history, setHistory] = useState<Attempt[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [hasPracticeProgress, setHasPracticeProgress] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    // Check localStorage first
    const localId = localStorage.getItem('rpas_user_id')
    const localName = localStorage.getItem('rpas_user_name')
    const localEmail = localStorage.getItem('rpas_user_email')
    const localProvider = localStorage.getItem('rpas_auth_provider') as 'local' | 'google' | null

    if (!localId || !localName) {
      router.replace('/')
      return
    }

    const userData: LocalUser = {
      id: localId,
      name: localName,
      email: localEmail || '',
      provider: localProvider || 'local',
    }
    setUser(userData)

    // If Google user, load from Supabase
    if (userData.provider === 'google') {
      try {
        const client = getSupabase()
        // Ensure profile exists
        const avatar = localStorage.getItem('rpas_user_avatar') || null
        await client.from('profiles').upsert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: avatar,
        }, { onConflict: 'id' })

        const { data: attempts } = await getAttempts(userData.id)
        setHistory(attempts || [])
      } catch (err) {
        console.error('Error loading Supabase data:', err)
      }
    }

    // Check local practice progress
    const progress = loadPracticeProgress()
    setHasPracticeProgress(Object.keys(progress.answers).length > 0)

    setLoading(false)
  }

  const handleClearHistory = async () => {
    if (!confirm('¿Eliminar todo el historial de ensayos?')) return
    
    if (user?.provider === 'google') {
      for (const attempt of history) {
        await deleteAttempt(attempt.id)
      }
    }
    
    setHistory([])
    toast.success('Historial eliminado')
  }

  const handleLoadLeaderboard = async () => {
    setShowLeaderboard(true)
    const { data } = await getLeaderboard(20)
    setLeaderboard(data || [])
  }

  const handleLogout = async () => {
    if (user?.provider === 'google') {
      await signOut()
    }
    // Clear all local storage
    localStorage.removeItem('rpas_user_id')
    localStorage.removeItem('rpas_user_name')
    localStorage.removeItem('rpas_user_email')
    localStorage.removeItem('rpas_auth_provider')
    localStorage.removeItem('rpas_user_avatar')
    clearEvalStorage()
    router.push('/')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const handleResumePractice = () => router.push('/quiz/practice')

  const handleRestartPractice = () => {
    if (confirm('¿Perder el progreso actual y comenzar de nuevo?')) {
      localStorage.removeItem('rpas_practice_answers')
      localStorage.removeItem('rpas_practice_index')
      router.push('/quiz/practice')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050508] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(220_40%_12%/0.3),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220_20%_15%/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220_20%_15%/0.2)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5 overflow-hidden">
            <Plane className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-white">
            Hola, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{user?.name || 'Piloto'}</span>
          </h1>
          <p className="text-slate-400 text-lg font-light mt-3">Selecciona el modo de estudio</p>
          {user?.provider === 'local' && (
            <p className="text-xs text-amber-400/80 mt-2">
              Modo invitado — Inicia sesión con Google para guardar historial, ensayos y enviar evaluaciones
            </p>
          )}
        </motion.div>

        <div className={`grid gap-5 mb-6 ${user?.provider === 'google' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/practice')}
            className="rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-cyan-400/30 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Modo Práctica</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">Responde las 79 preguntas del banco completo. Revisa tus respuestas al finalizar con detalle de correctas e incorrectas.</p>
            <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm">
              <span>79 preguntas</span><span className="text-slate-600">•</span><span>Sin límite de tiempo</span>
            </div>
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/practice-evaluation')}
            className="rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-violet-400/30 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center mb-6">
              <FlaskConical className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Modo Ensayo</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">Simulacro con 60 preguntas aleatorias. Practica el formato de evaluación sin enviar resultados por correo.</p>
            <div className="flex items-center gap-2 text-violet-400 font-medium text-sm">
              <span>60 preguntas</span><span className="text-slate-600">•</span><span>Sin envío de email</span>
            </div>
          </motion.button>

          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/evaluation')}
            className={`rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-emerald-400/30 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl ${user?.provider === 'local' ? 'hidden' : ''}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center mb-6">
              <ClipboardCheck className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Modo Evaluación</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">Simulacro real con 60 preguntas aleatorias. Un solo intento. Resultados enviados automáticamente al profesor.</p>
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <span>60 preguntas</span><span className="text-slate-600">•</span><span>Envía calificación</span>
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {hasPracticeProgress && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                  <span className="text-sm text-cyan-200">Tienes una práctica en progreso</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleResumePractice} className="text-xs bg-cyan-500/15 text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-500/25 transition-colors">Continuar</button>
                  <button onClick={handleRestartPractice} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5 transition-colors">Reiniciar</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {user?.provider === 'google' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-4">
              <button onClick={() => setShowHistory(v => !v)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-slate-300">Historial de ensayos</span>
                  <span className="text-xs bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded-full">{history.length}</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {history.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">Aún no tienes ensayos registrados. ¡Comienza a practicar!</div>
                      )}
                      {history.map((h, idx) => (
                        <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                          className={`flex items-center justify-between p-3 rounded-xl border ${h.type === 'evaluation' ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-cyan-500/10 bg-cyan-500/5'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.type === 'evaluation' ? 'bg-emerald-500/10 text-emerald-400' : h.type === 'practice' ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                              {h.type === 'evaluation' ? <ClipboardCheck className="w-4 h-4" /> : h.type === 'practice' ? <FlaskConical className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm text-slate-200 font-medium">{h.type === 'evaluation' ? 'Evaluación' : h.type === 'practice' ? 'Ensayo' : 'Práctica'} — {h.percentage}%</p>
                              <p className="text-[10px] text-slate-500">{formatDate(h.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold font-mono ${h.percentage >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>{h.grade}</p>
                            <p className="text-[10px] text-slate-500">{h.score}/{h.total}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {history.length > 0 && (
                      <div className="mt-3 flex justify-end">
                        <button onClick={handleClearHistory} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Limpiar historial
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
              <button onClick={() => { if (!showLeaderboard) handleLoadLeaderboard(); else setShowLeaderboard(false); }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-slate-300">Ranking global</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showLeaderboard ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showLeaderboard && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {leaderboard.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">Aún no hay datos en el ranking. ¡Sé el primero!</div>
                      )}
                      {leaderboard.map((entry: any, idx: number) => (
                        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-3 rounded-xl border border-amber-500/10 bg-amber-500/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-300' : idx === 1 ? 'bg-slate-400/20 text-slate-300' : idx === 2 ? 'bg-orange-600/20 text-orange-300' : 'bg-white/[0.03] text-slate-500'
                            }`}>{idx + 1}</div>
                            <div>
                              <p className="text-sm text-slate-200 font-medium">{entry.profiles?.name || 'Anónimo'}</p>
                              <p className="text-[10px] text-slate-500">{entry.percentage}% • {entry.grade}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono text-amber-400">{entry.score}/{entry.total}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={handleLogout}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]">
            <ArrowLeft className="w-4 h-4" /> Cerrar sesión
          </button>
        </motion.div>
      </div>
    </main>
  )
}
