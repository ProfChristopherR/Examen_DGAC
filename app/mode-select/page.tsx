'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ClipboardCheck, Plane, ArrowLeft, History, Trash2, Download, Upload, Trophy, AlertCircle, User, ChevronRight, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getUser, clearUser, getHistory, clearHistory, exportData, importData, loadPracticeProgress, clearEvalStorage } from '@/lib/storage'
import type { HistoryEntry, UserProfile } from '@/lib/storage'

export default function ModeSelect() {
  const router = useRouter()
  const [user, setLocalUser] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [hasPracticeProgress, setHasPracticeProgress] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.replace('/')
      return
    }
    setLocalUser(u)
    setHistory(getHistory())
    const progress = loadPracticeProgress()
    setHasPracticeProgress(Object.keys(progress.answers).length > 0)
  }, [router])

  const handleClearHistory = () => {
    if (!confirm('¿Eliminar todo el historial de ensayos?')) return
    clearHistory()
    setHistory([])
    toast.success('Historial eliminado')
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rpas_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Datos exportados')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importData(String(ev.target?.result || ''))
      if (result.success) {
        toast.success(result.message)
        setHistory(getHistory())
        const u = getUser()
        if (u) setLocalUser(u)
      } else {
        toast.error(result.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleLogout = () => {
    clearUser()
    clearEvalStorage()
    router.push('/')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const handleResumePractice = () => {
    router.push('/quiz/practice')
  }

  const handleRestartPractice = () => {
    if (confirm('¿Perder el progreso actual y comenzar de nuevo?')) {
      localStorage.removeItem('rpas_practice_answers')
      localStorage.removeItem('rpas_practice_index')
      router.push('/quiz/practice')
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050508] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(220_40%_12%/0.3),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220_20%_15%/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220_20%_15%/0.2)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5 overflow-hidden"
          >
            {user.picture ? (
              <img src={user.picture} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <Plane className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
            )}
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-white">
            Hola, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{user.name || 'Piloto'}</span>
          </h1>
          <p className="text-slate-400 text-lg font-light mt-3">Selecciona el modo de estudio</p>
        </motion.div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/practice')}
            className="rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-cyan-400/30 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Modo Práctica</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">Responde las 79 preguntas del banco completo. Revisa tus respuestas al finalizar con detalle de correctas e incorrectas.</p>
            <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm">
              <span>79 preguntas</span>
              <span className="text-slate-600">•</span>
              <span>Sin límite de tiempo</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/evaluation')}
            className="rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-emerald-400/30 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center mb-6">
              <ClipboardCheck className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Modo Evaluación</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">Simulacro real con 60 preguntas aleatorias. Un solo intento. Los resultados se envían por correo electrónico.</p>
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <span>60 preguntas</span>
              <span className="text-slate-600">•</span>
              <span>Un intento</span>
            </div>
          </motion.button>
        </div>

        {/* Resume practice banner */}
        <AnimatePresence>
          {hasPracticeProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                  <span className="text-sm text-cyan-200">Tienes una práctica en progreso</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResumePractice}
                    className="text-xs bg-cyan-500/15 text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-500/25 transition-colors"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={handleRestartPractice}
                    className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5 transition-colors"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              <span className="text-sm font-medium text-slate-300">Historial de ensayos</span>
              <span className="text-xs bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded-full">{history.length}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {history.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Aún no tienes ensayos registrados. ¡Comienza a practicar!
                    </div>
                  )}
                  {history.map((h, idx) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex items-center justify-between p-3 rounded-xl border ${h.type === 'evaluation' ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-cyan-500/10 bg-cyan-500/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.type === 'evaluation' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                          {h.type === 'evaluation' ? <ClipboardCheck className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm text-slate-200 font-medium">
                            {h.type === 'evaluation' ? 'Evaluación' : 'Práctica'} — {h.percentage}%
                          </p>
                          <p className="text-[10px] text-slate-500">{formatDate(h.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${h.percentage >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {h.grade}
                        </p>
                        <p className="text-[10px] text-slate-500">{h.score}/{h.total}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {history.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Limpiar historial
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]"
          >
            <Download className="w-4 h-4" /> Respaldar datos
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]"
          >
            <Upload className="w-4 h-4" /> Restaurar datos
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]"
          >
            <ArrowLeft className="w-4 h-4" /> Cambiar cuenta
          </button>
        </motion.div>
      </div>
    </main>
  )
}
