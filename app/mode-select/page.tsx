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
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Plane className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Hola, <span className="text-primary">{userName || 'Piloto'}</span>
          </h1>
          <p className="text-muted-foreground mt-2">Selecciona el modo de estudio</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/practice')}
            className="bg-card rounded-2xl p-8 text-left transition-all hover:ring-2 hover:ring-blue-300"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Modo Práctica</h2>
            <p className="text-muted-foreground text-sm mb-4">Responde las 79 preguntas del banco completo. Revisa tus respuestas al finalizar con detalle de correctas e incorrectas.</p>
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
              <span>79 preguntas</span>
              <span className="text-muted-foreground">•</span>
              <span>Sin límite de tiempo</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/quiz/evaluation')}
            className="bg-card rounded-2xl p-8 text-left transition-all hover:ring-2 hover:ring-green-300"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-5">
              <ClipboardCheck className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Modo Evaluación</h2>
            <p className="text-muted-foreground text-sm mb-4">60 preguntas seleccionadas al azar. Un solo intento. Los resultados se envían por correo electrónico.</p>
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
              <span>60 preguntas</span>
              <span className="text-muted-foreground">•</span>
              <span>Un intento</span>
            </div>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <button
            onClick={() => {
              localStorage.removeItem('rpas_user_id')
              localStorage.removeItem('rpas_user_name')
              localStorage.removeItem('rpas_user_email')
              router.push('/')
            }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cambiar cuenta
          </button>
        </motion.div>
      </div>
    </main>
  )
}
