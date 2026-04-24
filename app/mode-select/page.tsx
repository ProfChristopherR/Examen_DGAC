'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ClipboardCheck, Plane, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ModeSelect() {
  const router = useRouter()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('rpas_user_id')
    const storedName = localStorage.getItem('rpas_user_name')
    if (!userId) {
      router.replace('/')
      return
    }
    setUserName(storedName ?? '')
  }, [router])

  return (
    <main className="min-h-screen aurora-bg flex items-center justify-center p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-2xl">
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
            className="mx-auto w-16 h-16 rounded-full glass flex items-center justify-center mb-5"
          >
            <Plane className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-foreground">
            Hola, <span className="text-gradient">{userName || 'Piloto'}</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light mt-3">Selecciona el modo de estudio</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/practice')}
            className="glass rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-blue-300/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Modo Práctica</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">Responde las 79 preguntas del banco completo. Revisa tus respuestas al finalizar con detalle de correctas e incorrectas.</p>
            <div className="flex items-center gap-2 text-blue-500 font-medium text-sm">
              <span>79 preguntas</span>
              <span className="text-muted-foreground/50">•</span>
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
            className="glass rounded-2xl p-8 text-left transition-all hover:ring-1 hover:ring-emerald-300/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center mb-6">
              <ClipboardCheck className="w-7 h-7 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Modo Evaluación</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">60 preguntas seleccionadas al azar. Un solo intento. Los resultados se envían por correo electrónico.</p>
            <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm">
              <span>60 preguntas</span>
              <span className="text-muted-foreground/50">•</span>
              <span>Un intento</span>
            </div>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center mt-10"
        >
          <button
            onClick={() => {
              localStorage.removeItem('rpas_user_id')
              localStorage.removeItem('rpas_user_name')
              localStorage.removeItem('rpas_user_email')
              router.push('/')
            }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Cambiar cuenta
          </button>
        </motion.div>
      </div>
    </main>
  )
}
