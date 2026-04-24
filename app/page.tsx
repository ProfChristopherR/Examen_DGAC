'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plane, BookOpen, ClipboardCheck, ArrowRight, User, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function Home() {
  const [step, setStep] = useState<'welcome' | 'register'>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!name?.trim() || !email?.trim()) {
      toast.error('Por favor completa todos los campos')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Por favor ingresa un email válido')
      return
    }
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const userId = 'user_' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('rpas_user_id', userId)
      localStorage.setItem('rpas_user_name', name?.trim() ?? '')
      localStorage.setItem('rpas_user_email', email?.trim() ?? '')
      router.push('/mode-select')
    } catch (err: any) {
      console.error(err)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen aurora-bg flex items-center justify-center p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-xl">
        {step === 'welcome' ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Orb icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-24 h-24 mb-8 rounded-full glass flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Plane className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl sm:text-6xl font-black tracking-tighter text-foreground mb-4"
            >
              Examen <span className="text-gradient">RPAS</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-muted-foreground text-lg sm:text-xl font-light mb-2"
            >
              Sistema de Práctica y Evaluación
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-muted-foreground/70 text-sm sm:text-base mb-10 max-w-md mx-auto leading-relaxed"
            >
              Prepárate para la obtención de tu credencial de piloto remoto RPAS según la normativa DGAC Chile.
            </motion.p>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
            >
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-base">Modo Práctica</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">79 preguntas con revisión detallada de respuestas correctas e incorrectas.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <ClipboardCheck className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-base">Modo Evaluación</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">60 preguntas aleatorias, un solo intento. Resultados enviados por email.</p>
              </motion.div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('register')}
              className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-semibold text-lg inline-flex items-center gap-3 glow-primary hover:opacity-90 transition-opacity"
            >
              Comenzar <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-3xl p-8 sm:p-10"
          >
            <div className="text-center mb-8">
              <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Registro</h2>
              <p className="text-muted-foreground text-sm mt-2">Ingresa tus datos para comenzar</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e: any) => setName(e?.target?.value ?? '')}
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background/60 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e: any) => setEmail(e?.target?.value ?? '')}
                    placeholder="Ej: juan@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background/60 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 glow-primary"
              >
                {loading ? 'Registrando...' : 'Continuar'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </motion.button>

              <button
                onClick={() => setStep('welcome')}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← Volver
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
