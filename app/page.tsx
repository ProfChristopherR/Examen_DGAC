'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { Plane, BookOpen, ClipboardCheck, ArrowRight, User, Mail, Shield, Zap, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    if (!ref.current) return
    const { left, top } = ref.current.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              hsl(var(--primary) / 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

export default function Home() {
  const [step, setStep] = useState<'welcome' | 'register'>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
    <main className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      
      {/* Floating orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-[15%] w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"
      />

      {/* Mouse spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.07), transparent 40%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-5xl">
        {step === 'welcome' ? (
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-8 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Plataforma oficial de preparación DGAC Chile
            </motion.div>

            {/* Main title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white mb-6"
            >
              Examen{' '}
              <span className="inline-block bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                RPAS
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg sm:text-xl text-neutral-400 font-light max-w-2xl mx-auto mb-4 leading-relaxed"
            >
              Sistema de Práctica y Evaluación para pilotos de aeronaves remotamente tripuladas
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm text-neutral-500 max-w-lg mx-auto mb-12 leading-relaxed"
            >
              Prepárate para la obtención de tu credencial de piloto remoto según la normativa vigente de la Dirección General de Aeronáutica Civil de Chile.
            </motion.p>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center gap-8 sm:gap-12 mb-12"
            >
              {[
                { icon: Shield, label: 'Preguntas oficiales', value: '79' },
                { icon: Zap, label: 'Modos de estudio', value: '2' },
                { icon: Globe, label: 'Normativa DGAC', value: '100%' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{stat.value}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12"
            >
              <SpotlightCard>
                <div className="h-full rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 text-left hover:bg-white/[0.05] transition-colors duration-500">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                    <BookOpen className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">Modo Práctica</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-4">Accede al banco completo de 79 preguntas con revisión detallada. Sin límite de tiempo, ideal para dominar cada concepto.</p>
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                    <span>79 preguntas</span>
                    <span className="text-neutral-600">•</span>
                    <span>Sin límite</span>
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard>
                <div className="h-full rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 text-left hover:bg-white/[0.05] transition-colors duration-500">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                    <ClipboardCheck className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">Modo Evaluación</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-4">Simulacro real con 60 preguntas aleatorias. Un solo intento. Resultados enviados automáticamente por correo.</p>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <span>60 preguntas</span>
                    <span className="text-neutral-600">•</span>
                    <span>Un intento</span>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setStep('register')}
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-semibold text-lg overflow-hidden"
              >
                <span className="relative z-10">Comenzar ahora</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-neutral-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.button>
              <p className="text-xs text-neutral-600 mt-4">Gratuito • Sin registro complejo</p>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md mx-auto"
          >
            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <User className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Crear cuenta</h2>
                <p className="text-neutral-400 text-sm mt-2">Ingresa tus datos para comenzar tu preparación</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e: any) => setName(e?.target?.value ?? '')}
                      placeholder="Ej: Juan Pérez"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e: any) => setEmail(e?.target?.value ?? '')}
                      placeholder="Ej: juan@email.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-white text-black py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Continuar'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </motion.button>

                <button
                  onClick={() => setStep('welcome')}
                  className="w-full text-center text-sm text-neutral-500 hover:text-neutral-300 transition-colors py-2"
                >
                  ← Volver al inicio
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
