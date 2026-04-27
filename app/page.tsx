'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionTemplate, useMotionValue, AnimatePresence } from 'framer-motion'
import { BookOpen, ClipboardCheck, ArrowRight, User, Mail, Shield, Zap, Globe, ChevronRight, Download, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase, signInWithGoogle, getSession } from '@/lib/supabase'
import { exportData, importData } from '@/lib/storage'

/* ─── Animated Drone SVG Component ─── */
function DroneHero({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 400 320"
      className={`${className}`}
      initial={{ y: 0 }}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Propeller blur rings */}
      {[110, 290].map((cx, i) => (
        <motion.ellipse
          key={`prop-blur-tl-${i}`}
          cx={cx}
          cy="75"
          rx="38"
          ry="6"
          fill="none"
          stroke="hsl(190 90% 60% / 0.25)"
          strokeWidth="2"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 0.08, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${cx}px 75px` }}
        />
      ))}
      {[110, 290].map((cx, i) => (
        <motion.ellipse
          key={`prop-blur-bl-${i}`}
          cx={cx}
          cy="245"
          rx="38"
          ry="6"
          fill="none"
          stroke="hsl(190 90% 60% / 0.25)"
          strokeWidth="2"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 0.08, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${cx}px 245px` }}
        />
      ))}

      {/* Arms */}
      <path d="M110 75 L200 160 L290 75" fill="none" stroke="hsl(220 20% 35%)" strokeWidth="6" strokeLinecap="round" />
      <path d="M110 245 L200 160 L290 245" fill="none" stroke="hsl(220 20% 35%)" strokeWidth="6" strokeLinecap="round" />

      {/* Body shell */}
      <rect x="155" y="130" width="90" height="60" rx="18" fill="hsl(220 15% 12%)" stroke="hsl(190 90% 55% / 0.5)" strokeWidth="1.5" />
      <rect x="165" y="140" width="70" height="40" rx="10" fill="hsl(220 15% 8%)" />

      {/* Camera gimbal */}
      <motion.g
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="200" cy="190" r="14" fill="hsl(220 15% 10%)" stroke="hsl(190 90% 55% / 0.4)" strokeWidth="1.5" />
        <circle cx="200" cy="190" r="8" fill="hsl(190 90% 55% / 0.15)" stroke="hsl(190 90% 55% / 0.6)" strokeWidth="1" />
        <circle cx="200" cy="190" r="3" fill="hsl(190 90% 65%)" />
      </motion.g>

      {/* Propeller motors */}
      {[
        [110, 75],
        [290, 75],
        [110, 245],
        [290, 245],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="14" fill="hsl(220 15% 10%)" stroke="hsl(220 20% 30%)" strokeWidth="2" />
          <motion.line
            x1={cx - 32}
            y1={cy}
            x2={cx + 32}
            y2={cy}
            stroke="hsl(220 20% 45%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.06, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        </g>
      ))}

      {/* LED status lights */}
      <circle cx="170" cy="148" r="3" fill="hsl(150 90% 55%)" />
      <circle cx="230" cy="148" r="3" fill="hsl(0 90% 60%)" />

      {/* Scanning laser beam */}
      <motion.line
        x1="200"
        y1="190"
        x2="200"
        y2="320"
        stroke="hsl(190 90% 60% / 0.3)"
        strokeWidth="1"
        strokeDasharray="4 6"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  )
}

/* ─── Spotlight Card ─── */
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
    <div ref={ref} onMouseMove={handleMouseMove} className={`group relative ${className}`}>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              hsl(190 90% 55% / 0.12),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

/* ─── Particle Field ─── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []
    const PARTICLE_COUNT = 60

    function resize() {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }

    let animId: number
    function draw() {
      ctx.clearRect(0, 0, w, h)
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(190 90% 70% / ${p.alpha})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `hsl(190 90% 60% / ${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />
}

/* ─── Main Page ─── */
export default function Home() {
  const [step, setStep] = useState<'welcome' | 'register'>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if already logged in via Supabase
  useEffect(() => {
    getSession().then(session => {
      if (session?.user) {
        router.push('/mode-select')
      }
      setCheckingSession(false)
    })
  }, [router])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).substring(2, 15),
        options: {
          data: { name: name.trim() }
        }
      })
      if (error) {
        // If user already exists, try sign in with magic link
        if (error.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { data: { name: name.trim() } }
          })
          if (signInError) throw signInError
          toast.success('Te enviamos un enlace mágico a tu correo')
          return
        }
        throw error
      }
      if (data.user) {
        router.push('/mode-select')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error(error.message || 'Error al iniciar sesión con Google')
      setLoading(false)
    }
    // Redirect happens automatically via OAuth callback
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
    toast.success('Datos exportados correctamente')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importData(String(ev.target?.result || ''))
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (checkingSession) {
    return (
      <main className="relative min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-[#050508] overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Deep space background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(220_40%_12%/0.4),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220_20%_15%/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220_20%_15%/0.3)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] opacity-40 pointer-events-none" />

      <ParticleField />

      {/* Floating neons */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] left-[10%] w-80 h-80 bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[10%] right-[8%] w-96 h-96 bg-violet-500/8 rounded-full blur-[140px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"
      />

      {/* Mouse spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] transition-opacity duration-300"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, hsl(190 90% 55% / 0.06), transparent 45%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-6xl">
        <AnimatePresence mode="wait">
          {step === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Top badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center mb-6"
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-cyan-500/20 text-sm text-cyan-300/80 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                  </span>
                  Plataforma oficial de preparación DGAC Chile
                </div>
              </motion.div>

              {/* Hero with drone */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-14">
                <div className="text-center lg:text-left order-2 lg:order-1">
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white mb-5 leading-[1.05]"
                  >
                    Examen{' '}
                    <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent animate-gradient-x">
                      RPAS
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-lg sm:text-xl text-slate-400 font-light max-w-xl mx-auto lg:mx-0 mb-3 leading-relaxed"
                  >
                    Sistema de Práctica y Evaluación para pilotos de aeronaves remotamente tripuladas
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="text-sm text-slate-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed"
                  >
                    Prepárate para la obtención de tu credencial de piloto remoto según la normativa vigente de la Dirección General de Aeronáutica Civil de Chile.
                  </motion.p>

                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-center lg:justify-start gap-8 sm:gap-10 mb-10"
                  >
                    {[
                      { icon: Shield, label: 'Preguntas oficiales', value: '79' },
                      { icon: Zap, label: 'Modos de estudio', value: '2' },
                      { icon: Globe, label: 'Normativa DGAC', value: '100%' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <stat.icon className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                          <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{stat.value}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setStep('register')}
                      className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg overflow-hidden shadow-lg shadow-cyan-500/20"
                    >
                      <span className="relative z-10">Comenzar ahora</span>
                      <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all text-sm"
                      >
                        <Download className="w-4 h-4" /> Respaldar
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all text-sm"
                      >
                        <Upload className="w-4 h-4" /> Restaurar
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xs text-slate-600 mt-4"
                  >
                    Gratuito • Historial en la nube con Supabase • Google Login disponible
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="relative order-1 lg:order-2 flex items-center justify-center"
                >
                  <div className="relative w-full max-w-[420px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent rounded-full blur-3xl" />
                    <DroneHero className="w-full h-auto drop-shadow-[0_0_40px_hsl(190_90%_55%/0.15)]" />
                  </div>
                </motion.div>
              </div>

              {/* Feature cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
              >
                <SpotlightCard>
                  <div className="h-full rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-6 sm:p-8 text-left hover:bg-white/[0.04] transition-colors duration-500">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                      <BookOpen className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mb-2">Modo Práctica</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">Accede al banco completo de 79 preguntas con revisión detallada. Sin límite de tiempo, ideal para dominar cada concepto.</p>
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                      <span>79 preguntas</span>
                      <span className="text-slate-600">•</span>
                      <span>Sin límite</span>
                    </div>
                  </div>
                </SpotlightCard>

                <SpotlightCard>
                  <div className="h-full rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-6 sm:p-8 text-left hover:bg-white/[0.04] transition-colors duration-500">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                      <ClipboardCheck className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mb-2">Modo Evaluación</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">Simulacro real con 60 preguntas aleatorias. Un solo intento. Resultados enviados automáticamente por correo.</p>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <span>60 preguntas</span>
                      <span className="text-slate-600">•</span>
                      <span>Un intento</span>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md mx-auto"
            >
              <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="mx-auto w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                    <User className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Crear cuenta</h2>
                  <p className="text-slate-400 text-sm mt-2">Ingresa tus datos para comenzar tu preparación</p>
                </div>

                {/* Google Sign In */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-black font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 mb-4"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </motion.button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0a0a0f] px-3 text-slate-500">o usa email</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.5} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ej: juan@email.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-cyan-500/15"
                  >
                    {loading ? 'Registrando...' : 'Continuar'}
                    {!loading && <ChevronRight className="w-5 h-5" />}
                  </motion.button>

                  <button
                    onClick={() => setStep('welcome')}
                    className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
                  >
                    ← Volver al inicio
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
