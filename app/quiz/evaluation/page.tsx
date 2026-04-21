'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardCheck, ChevronLeft, ChevronRight, Check, X, ArrowLeft, Send, Trophy, AlertCircle, Mail, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

  useEffect(() => {
    const userId = localStorage.getItem('rpas_user_id')
    if (!userId) {
      router.replace('/')
      return
    }
    fetchQuestions()
  }, [])

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

      setQuestions(formatted.slice(0, 60))
    } catch (err: any) {
      console.error(err)
      toast.error('Error de conexión al cargar preguntas')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async () => {
    if (submitted) return
    const answeredCount = Object.keys(answers ?? {})?.length ?? 0
    const totalCount = questions?.length ?? 0
    
    if (answeredCount < totalCount) {
      toast.error(`Debes responder todas las preguntas (${answeredCount}/${totalCount}) antes de finalizar la evaluación.`)
      return
    }

    if (!confirm('\u00bfEst\u00e1s seguro de enviar? Esta es tu \u00fanica oportunidad.')) return


    setSubmitting(true)
    try {
      const userName = localStorage.getItem('rpas_user_name') ?? ''
      const userEmail = localStorage.getItem('rpas_user_email') ?? ''

      // Simulate network wait for UX
      await new Promise(resolve => setTimeout(resolve, 800))
      
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

      // Send email with EmailJS REST API
      setEmailSending(true)
      
      const emailContent = `
        Nombre: ${userName}
        Email: ${userEmail}
        Nota: ${gradeStr}
        Porcentaje: ${percentage}%
        Respuestas correctas: ${correctCount}/${totalCount}
        
        -- PREGUNTAS INCORRECTAS --
        ${resultsArr.filter((r: any) => !r.isCorrect).map((r: any) => `
        #${r.questionNumber} ${r.questionText}
        Tu respuesta: ${r.userAnswer?.toUpperCase?.()} - ${getOptionText(r, r.userAnswer)}
        Correcta: ${r.correctAnswer?.toUpperCase?.()} - ${getOptionText(r, r.correctAnswer)}
        `).join('\n')}
      `

      const emailData = {
        service_id: 'service_nbju40d',
        template_id: 'template_9dvik9e',
        user_id: 'QIlZqn3_PidWSY9Mm',
        template_params: {
          to_email: 'christopherruiz@liceosannicolas.cl',
          user_name: userName,
          user_email: userEmail,
          grade: gradeStr,
          message: emailContent // Ensure EmailJS template has {{{message}}} 
        }
      };

      try {
        const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        })
        if (emailRes.ok) {
          setEmailSent(true)
          toast.success('Resultados enviados por correo')
        } else {
          console.error("EmailJS error", await emailRes.text())
          toast.error('Revisa la consola: Faltan llaves de EmailJS en el c\u00f3digo.')
        }
      } catch (emailErr: any) {
        console.error('Email error:', emailErr)
        toast.error('Revisa la consola: Faltan llaves de EmailJS.')
      } finally {
        setEmailSending(false)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Error al evaluar')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Preparando evaluación...</p>
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
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 mb-6 text-center"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${approved ? 'bg-green-100' : 'bg-red-100'}`}>
              {approved ? <Trophy className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
              {approved ? '¡Aprobado!' : 'No aprobado'}
            </h1>
            <p className="text-muted-foreground mb-6">Resultado de tu evaluación RPAS</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold font-mono text-foreground">{results?.correctCount ?? 0}/{results?.totalQuestions ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Correctas</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold font-mono text-foreground">{percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">Porcentaje</p>
              </div>
              <div className={`rounded-xl p-4 ${approved ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-2xl font-bold font-mono ${approved ? 'text-green-600' : 'text-red-600'}`}>{grade}</p>
                <p className="text-xs text-muted-foreground mt-1">Nota</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              {emailSending ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando resultados por correo...
                </span>
              ) : emailSent ? (
                <span className="inline-flex items-center gap-2 text-sm text-green-600">
                  <Mail className="w-4 h-4" /> Resultados enviados a christopherruiz@liceosannicolas.cl
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" /> Pendiente de envío
                </span>
              )}
            </div>

            <button
              onClick={() => router.push('/mode-select')}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al menú
            </button>
          </motion.div>

          {/* Show incorrect answers */}
          {(incorrectResults?.length ?? 0) > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold text-foreground mb-3">
                Preguntas incorrectas ({incorrectResults?.length ?? 0})
              </h3>
              <div className="space-y-3">
                {(incorrectResults ?? []).map((result: ResultItem, idx: number) => (
                  <motion.div
                    key={result?.questionId ?? idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    className="bg-card rounded-xl p-5 border-l-4 border-l-red-500"
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                  >
                    <p className="text-sm font-medium text-foreground mb-3">
                      <span className="text-muted-foreground">#{result?.questionNumber ?? 0}</span>{' '}
                      {result?.questionText ?? ''}
                    </p>
                    <div className="space-y-1.5">
                      {['a', 'b', 'c', 'd'].map((letter: string) => {
                        const isUser = result?.userAnswer === letter
                        const isCorrectAnswer = result?.correctAnswer === letter
                        let classes = 'text-sm px-3 py-1.5 rounded-md '
                        if (isCorrectAnswer) classes += 'bg-green-50 text-green-800 font-medium '
                        else if (isUser) classes += 'bg-red-50 text-red-800 line-through '
                        else classes += 'text-muted-foreground '

                        return (
                          <div key={letter} className={classes}>
                            <span className="font-mono font-bold mr-2">{letter?.toUpperCase?.() ?? ''})  </span>
                            {getOptionText(result, letter)}
                            {isCorrectAnswer && <span className="ml-2 text-green-600">✓</span>}
                            {isUser && !isCorrectAnswer && <span className="ml-2 text-red-500">(tu respuesta)</span>}
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
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (confirm('\u00bfSeguro que deseas salir? Perder\u00e1s tu progreso.')) {
                router.push('/mode-select')
              }
            }}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Salir
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={fillRandomAnswers}
              className="text-[10px] text-muted-foreground opacity-30 hover:opacity-100 transition-opacity mr-4 decoration-dotted underline"
            >
              Test Button
            </button>
            <ClipboardCheck className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">Evaluación</span>
          </div>
          <span className="text-sm text-muted-foreground">{answeredCount}/{totalQuestions}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <motion.div
            className="bg-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
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
              transition={{ duration: 0.25 }}
              className="bg-card rounded-2xl p-6 mb-6"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Pregunta {currentIndex + 1} de {totalQuestions}
                </span>
              </div>

              <p className="text-base font-medium text-foreground mb-5">
                {currentQuestion?.questionText ?? ''}
              </p>

              <div className="space-y-2.5">
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
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-background text-muted-foreground border border-border'
                      }`}>
                        {letter?.toUpperCase?.() ?? ''}
                      </span>
                      <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
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
            className="bg-muted text-foreground px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Finalizar Evaluación'}
              {!submitting && <Send className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
              className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-green-700 transition-colors"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="mt-6 flex flex-wrap gap-1.5 justify-center">
          {(questions ?? []).map((q: Question, idx: number) => (
            <button
              key={q?.id ?? idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-7 h-7 rounded-md text-xs font-mono font-bold transition-all ${
                idx === currentIndex
                  ? 'bg-green-600 text-white scale-110'
                  : answers?.[q?.id ?? ''] 
                    ? 'bg-green-200 text-green-700'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
