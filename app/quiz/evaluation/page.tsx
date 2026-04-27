'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardCheck, ChevronLeft, ChevronRight, Check, X, ArrowLeft, Send, Trophy, AlertCircle, Mail, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getCurrentUser, getSupabase } from '@/lib/supabase'
import { clearEvalStorage } from '@/lib/storage'
import { splitQuestionLines } from '@/lib/format-question'

interface Question {
  id: string
  number: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
}

interface ResultItem {
  questionId: string
  questionNumber: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

function QuestionText({ text }: { text: string }) {
  const lines = splitQuestionLines(text)
  if (lines.length <= 1) {
    return <p className="text-base sm:text-lg font-medium text-white mb-6 leading-relaxed">{text}</p>
  }
  return (
    <div className="text-base sm:text-lg font-medium text-white mb-6 leading-relaxed space-y-2">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  )
}

export default function EvaluationQuiz() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.replace('/')
      return
    }
    setUser(currentUser)
    fetchQuestions()
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/Examen_DGAC/questions.json')
      const data = await res.json()

      const formatted = (data ?? []).map((q: any) => ({
        id: q?.number?.toString() ?? '',
        number: q?.number ?? 0,
        questionText: q?.question ?? '',
        optionA: q?.options?.a ?? '',
        optionB: q?.options?.b ?? '',
        optionC: q?.options?.c ?? '',
        optionD: q?.options?.d ?? '',
        correctAnswer: q?.correctAnswer ?? ''
      }))

      // Shuffle Fisher-Yates
      for (let i = formatted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [formatted[i], formatted[j]] = [formatted[j], formatted[i]]
      }

      const selected = formatted.slice(0, 60)
      setQuestions(selected)
      // Restore progress
      const savedQuestions = localStorage.getItem('rpas_eval_questions')
      const savedAnswers = localStorage.getItem('rpas_eval_answers')
      const savedIndex = localStorage.getItem('rpas_eval_index')
      const savedSubmitted = localStorage.getItem('rpas_eval_submitted')
      const savedResults = localStorage.getItem('rpas_eval_results')
      if (savedQuestions) {
        try {
          const parsed = JSON.parse(savedQuestions)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed)
          }
        } catch {}
      } else {
        localStorage.setItem('rpas_eval_questions', JSON.stringify(selected))
      }
      if (savedAnswers) {
        try { setAnswers(JSON.parse(savedAnswers)) } catch {}
      }
      if (savedIndex) {
        try { setCurrentIndex(parseInt(savedIndex, 10)) } catch {}
      }
      if (savedSubmitted === 'true') {
        setSubmitted(true)
        if (savedResults) {
          try {
            setResults(JSON.parse(savedResults))
            setShowResults(true)
          } catch {}
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Error de conexión al cargar preguntas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    localStorage.setItem('rpas_eval_answers', JSON.stringify(answers))
  }, [answers])

  useEffect(() => {
    localStorage.setItem('rpas_eval_index', String(currentIndex))
  }, [currentIndex])

  const selectAnswer = useCallback((questionId: string, answer: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...(prev ?? {}), [questionId]: answer }))
  }, [submitted])

  const getOptionText = (result: ResultItem, letter: string) => {
    const map: Record<string, string> = {
      a: result?.optionA ?? '',
      b: result?.optionB ?? '',
      c: result?.optionC ?? '',
      d: result?.optionD ?? '',
    }
    return map?.[letter] ?? ''
  }

  const fillRandomAnswers = () => {
    const newAnswers: Record<string, string> = {}
    questions.forEach(q => {
      const options = ['a', 'b', 'c', 'd']
      newAnswers[q.id] = options[Math.floor(Math.random() * options.length)]
    })
    setAnswers(newAnswers)
    toast.info('Respuestas autocompletadas (aleatorio)')
  }

  const handleSubmit = async () => {
    if (submitted || hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    const answeredCount = Object.keys(answers ?? {})?.length ?? 0
    const totalCount = questions?.length ?? 0

    if (answeredCount < totalCount) {
      hasSubmittedRef.current = false
      toast.error(`Debes responder todas las preguntas (${answeredCount}/${totalCount}) antes de finalizar la evaluación.`)
      return
    }

    setSubmitting(true)
    try {
      const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Usuario'
      const userEmail = user?.email || ''

      await new Promise(resolve => setTimeout(resolve, 600))

      let correctCount = 0
      const resultsArr = questions.map((q: any) => {
        const isCorrect = answers[q.id] === q.correctAnswer
        if (isCorrect) correctCount++
        return {
          questionId: q.id,
          questionNumber: q.number,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          userAnswer: answers[q.id] || '',
          correctAnswer: q.correctAnswer,
          isCorrect
        }
      })

      const percentage = Math.round((correctCount / totalCount) * 100)
      let grade = 1.0
      if (percentage < 60) {
        grade = Number((3 * (percentage / 60) + 1).toFixed(1))
      } else {
        grade = Number((3 * ((percentage - 60) / 40) + 4).toFixed(1))
      }
      const gradeStr = grade.toFixed(1).replace('.', ',')

      const evalData = {
        success: true,
        correctCount,
        totalQuestions: totalCount,
        percentage,
        grade: gradeStr,
        results: resultsArr
      }
      setResults(evalData)
      setShowResults(true)
      setSubmitted(true)
      localStorage.setItem('rpas_eval_submitted', 'true')
      localStorage.setItem('rpas_eval_results', JSON.stringify(evalData))

      // Save to Supabase
      if (user) {
        const client = getSupabase()
        const { error } = await client
          .from('attempts')
          .insert({
          user_id: user.id,
          type: 'evaluation',
          score: correctCount,
          total: totalCount,
          percentage,
          grade: gradeStr,
          answers,
        })
        if (error) {
          console.error('Error saving attempt:', error)
        }
      }

      // Build email body
      const incorrectList = resultsArr
        .filter((r: any) => !r.isCorrect)
        .map((r: any) => `#${r.questionNumber} ${r.questionText}\n  Tu resp: ${(r.userAnswer || '?').toUpperCase()} - ${getOptionText(r, r.userAnswer)}\n  Correcta: ${r.correctAnswer.toUpperCase()} - ${getOptionText(r, r.correctAnswer)}`)
        .join('\n\n')

      const emailBody = `Alumno: ${userName}\nEmail: ${userEmail}\nNota: ${gradeStr}\nPorcentaje: ${percentage}%\nCorrectas: ${correctCount}/${totalCount}\n\n--- INCORRECTAS ---\n${incorrectList}`

      // Send email to professor
      setEmailSending(true)
      const sendEmail = async (toEmail: string) => {
        const payload = {
          service_id: 'service_nbju40d',
          template_id: 'template_9dvik9e',
          user_id: 'QIlZqn3_PidWSY9Mm',
          template_params: {
            to_email: toEmail,
            user_name: userName,
            user_email: userEmail,
            grade: gradeStr,
            message: emailBody
          }
        }
        return fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      try {
        const [profRes, studentRes] = await Promise.allSettled([
          sendEmail('christopherruiz@liceosannicolas.cl'),
          userEmail ? sendEmail(userEmail) : Promise.resolve(null)
        ])
        const profOk = profRes.status === 'fulfilled' && (profRes.value as Response)?.ok
        if (profOk) {
          setEmailSent(true)
          localStorage.setItem('rpas_eval_email_sent', 'true')
          toast.success('Resultados enviados por correo')
        } else {
          toast.error('No se pudo enviar el correo. Revisa la consola.')
          console.error('Email prof result:', profRes)
          console.error('Email student result:', studentRes)
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr)
        toast.error('Error al enviar correo')
      } finally {
        setEmailSending(false)
      }
    } catch (err: any) {
      hasSubmittedRef.current = false
      console.error(err)
      toast.error('Error al evaluar')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Preparando evaluación...</p>
        </div>
      </main>
    )
  }

  if (showResults && results) {
    const percentage = results?.percentage ?? 0
    const grade = results?.grade ?? 0
    const approved = percentage >= 60
    const incorrectResults = (results?.results ?? []).filter((r: ResultItem) => !r?.isCorrect)

    return (
      <main className="min-h-screen bg-[#050508] p-4 sm:p-6">
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 sm:p-10 mb-6 text-center bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${approved ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {approved ? <Trophy className="w-8 h-8 text-emerald-400" strokeWidth={1.5} /> : <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter mb-1 text-white">
              {approved ? '¡Aprobado!' : 'No aprobado'}
            </h1>
            <p className="text-slate-400 mb-8">Resultado de tu evaluación RPAS</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{results?.correctCount ?? 0}/{results?.totalQuestions ?? 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest">Correctas</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{percentage}%</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest">Porcentaje</p>
              </div>
              <div className={`rounded-2xl p-4 sm:p-5 ${approved ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <p className={`text-2xl sm:text-3xl font-bold font-mono ${approved ? 'text-emerald-400' : 'text-red-400'}`}>{grade}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest">Nota</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-8">
              {emailSending ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> Enviando resultados por correo...
                </span>
              ) : emailSent ? (
                <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                  <Mail className="w-4 h-4" strokeWidth={1.5} /> Resultados enviados a christopherruiz@liceosannicolas.cl
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-4 h-4" strokeWidth={1.5} /> Pendiente de envío
                </span>
              )}
            </div>

            <button
              onClick={() => { clearEvalStorage(); router.push('/mode-select') }}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Volver al menú
            </button>
          </motion.div>

          {/* Show incorrect answers */}
          {(incorrectResults?.length ?? 0) > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-4">
                Preguntas incorrectas ({incorrectResults?.length ?? 0})
              </h3>
              <div className="space-y-4">
                {(incorrectResults ?? []).map((result: ResultItem, idx: number) => (
                  <motion.div
                    key={result?.questionId ?? idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    className="rounded-2xl p-5 sm:p-6 border-l-4 border-l-red-500 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl"
                  >
                    <div className="text-sm font-medium text-white mb-3 leading-relaxed space-y-1">
                      <p>
                        <span className="text-slate-500">#{result?.questionNumber ?? 0}</span>{' '}
                        {splitQuestionLines(result?.questionText ?? '').map((line, li) => (
                          <span key={li} className="block">{line}</span>
                        ))}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {['a', 'b', 'c', 'd'].map((letter: string) => {
                        const isUser = result?.userAnswer === letter
                        const isCorrectAnswer = result?.correctAnswer === letter
                        let classes = 'text-sm px-3 py-1.5 rounded-lg '
                        if (isCorrectAnswer) classes += 'bg-emerald-500/10 text-emerald-300 font-medium '
                        else if (isUser) classes += 'bg-red-500/10 text-red-300 line-through '
                        else classes += 'text-slate-500 '

                        return (
                          <div key={letter} className={classes}>
                            <span className="font-mono font-bold mr-2">{letter?.toUpperCase?.() ?? ''})</span>
                            {getOptionText(result, letter)}
                            {isCorrectAnswer && <span className="ml-2 text-emerald-400">✓</span>}
                            {isUser && !isCorrectAnswer && <span className="ml-2 text-red-400">(tu respuesta)</span>}
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  const currentQuestion = questions?.[currentIndex]
  const totalQuestions = questions?.length ?? 0
  const answeredCount = Object.keys(answers ?? {})?.length ?? 0
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <main className="min-h-screen bg-[#050508] p-4 sm:p-6">
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (confirm('¿Seguro que deseas salir? Perderás tu progreso.')) {
                clearEvalStorage()
                router.push('/mode-select')
              }
            }}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Salir
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={fillRandomAnswers}
              className="text-[10px] text-slate-500 opacity-30 hover:opacity-100 transition-opacity mr-4 decoration-dotted underline"
            >
              Test Button
            </button>
            <ClipboardCheck className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-white">Evaluación</span>
          </div>
          <span className="text-sm text-slate-500 font-mono">{answeredCount}/{totalQuestions}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div
            className="bg-emerald-500 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Question card */}
        {currentQuestion && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id ?? currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl p-6 sm:p-8 mb-8 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-emerald-500/10 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                  Pregunta {currentIndex + 1} de {totalQuestions}
                </span>
              </div>

              <QuestionText text={currentQuestion?.questionText ?? ''} />

              <div className="space-y-3">
                {(['a', 'b', 'c', 'd'] as const).map((letter: string) => {
                  const optionKey = `option${letter?.toUpperCase?.()}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'
                  const optionText = (currentQuestion as any)?.[optionKey] ?? ''
                  const isSelected = answers?.[currentQuestion?.id ?? ''] === letter

                  return (
                    <motion.button
                      key={letter}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectAnswer(currentQuestion?.id ?? '', letter)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-transparent bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-[#0a0a0f] text-slate-400 border border-white/[0.08]'
                      }`}>
                        {letter?.toUpperCase?.() ?? ''}
                      </span>
                      <span className={`text-sm sm:text-base ${isSelected ? 'text-white font-medium' : 'text-slate-400'}`}>
                        {optionText}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="bg-white/[0.03] text-white px-4 py-2.5 rounded-xl font-medium inline-flex items-center gap-1.5 hover:bg-white/[0.06] transition-colors disabled:opacity-40 border border-white/[0.06]"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> Anterior
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {submitting ? 'Enviando...' : 'Finalizar Evaluación'}
              {!submitting && <Send className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
              className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium inline-flex items-center gap-1.5 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Siguiente <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="mt-8 flex flex-wrap gap-1.5 justify-center">
          {(questions ?? []).map((q: Question, idx: number) => (
            <button
              key={q?.id ?? idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                idx === currentIndex
                  ? 'bg-emerald-500 text-white scale-110 shadow-sm'
                  : answers?.[q?.id ?? '']
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
