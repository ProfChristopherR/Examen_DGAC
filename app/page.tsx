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
      // Simulate small delay for UX
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {step === 'welcome' ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Plane className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-3">
              Examen <span className="text-primary">RPAS</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              Sistema de Práctica y Evaluación
            </p>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              Prepárate para la obtención de tu credencial de piloto remoto RPAS según la normativa DGAC Chile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-card rounded-xl p-5 text-left" style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Modo Práctica</h3>
                <p className="text-sm text-muted-foreground">79 preguntas con revisión detallada de respuestas correctas e incorrectas.</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-card rounded-xl p-5 text-left" style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <ClipboardCheck className="w-8 h-8 text-green-500 mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Modo Evaluación</h3>
                <p className="text-sm text-muted-foreground">60 preguntas aleatorias, un solo intento. Resultados enviados por email.</p>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('register')}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              Comenzar <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Registro</h2>
              <p className="text-muted-foreground text-sm mt-1">Ingresa tus datos para comenzar</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e: any) => setName(e?.target?.value ?? '')}
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e: any) => setEmail(e?.target?.value ?? '')}
                    placeholder="Ej: juan@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
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
