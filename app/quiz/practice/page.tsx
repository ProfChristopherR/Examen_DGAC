'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Check, X, ArrowLeft, Send, RotateCcw, Trophy, AlertCircle } from 'lucide-react'
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

export default function PracticeQuiz() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all')

  useEffect(() => {
    const userId = localStorage.getItem('rpas_user_id')
    if (!userId) {
      router.replace('/')
      return
    }
    fetchQuestions()
  }, [router])

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
      setQuestions(formatted)
    } catch (err: any) {
      console.error(err)
      toast.error('Error de conexión al cargar preguntas')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({ ...(prev ?? {}), [questionId]: answer }))
  }, [])

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers ?? {})?.length ?? 0
    const totalCount = questions?.length ?? 0
    if (answeredCount < totalCount) {
      const unanswered = totalCount - answeredCount
      if (!confirm(`Tienes ${unanswered} pregunta(s) sin responder. ¿Deseas enviar de todos modos?`)) return
    }

    setSubmitting(true)
    try {
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

      setResults({
        success: true,
        correctCount,
        totalQuestions: totalCount,
        percentage,
        grade: grade.toFixed(1).replace('.', ','),
        results: resultsArr
      })
      setShowResults(true)
    } catch (err: any) {
      console.error(err)
      toast.error('Error al evaluar')
    } finally {
      setSubmitting(false)
    }
  }

  const showAllAnswers = () => {
    const correctAnswers: Record<string, string> = {}
    questions.forEach((q: any) => {
      correctAnswers[q.id] = q.correctAnswer
    })
    const totalCount = questions.length
    const resultsArr = questions.map((q: any) => ({
      questionId: q.id,
      questionNumber: q.number,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      userAnswer: q.correctAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: true
    }))
    setAnswers(correctAnswers)
    setResults({
      success: true,
      correctCount: totalCount,
      totalQuestions: totalCount,
      percentage: 100,
      grade: '7,0',
      results: resultsArr
    })
    setShowResults(true)
  }

  const getOptionText = (result: ResultItem, letter: string) => {
    const map: Record<string, string> = {
      a: result?.optionA ?? '',
      b: result?.optionB ?? '',
      c: result?.optionC ?? '',
      d: result?.optionD ?? '',
    }
    return map?.[letter] ?? ''
  }

  const filteredResults = (results?.results ?? []).filter((r: ResultItem) => {
    if (reviewFilter === 'correct') return r?.isCorrect
    if (reviewFilter === 'incorrect') return !r?.isCorrect
    return true
  })

  if (loading) {
    return (
      <main className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando preguntas...</p>
        </div>
      </main>
    )
  }

  if (showResults && results) {
    const percentage = results?.percentage ?? 0
    const grade = results?.grade ?? 0
    const approved = percentage >= 60

    return (
      <main className="min-h-screen aurora-bg p-4 sm:p-6">
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 sm:p-10 mb-6 text-center"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${approved ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {approved ? <Trophy className="w-8 h-8 text-emerald-600" strokeWidth={1.5} /> : <AlertCircle className="w-8 h-8 text-red-600" strokeWidth={1.5} />}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter mb-2">
              {approved ? '¡Felicidades!' : 'Sigue practicando'}
            </h1>
            <p className="text-muted-foreground mb-8">Resultados del modo práctica</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-muted/40 rounded-2xl p-4 sm:p-5">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground">{results?.correctCount ?? 0}/{results?.totalQuestions ?? 0}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-widest">Correctas</p>
              </div>
              <div className="bg-muted/40 rounded-2xl p-4 sm:p-5">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground">{percentage}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-widest">Porcentaje</p>
              </div>
              <div className={`rounded-2xl p-4 sm:p-5 ${approved ? 'bg-emerald-50/70' : 'bg-red-50/70'}`}>
                <p className={`text-2xl sm:text-3xl font-bold font-mono ${approved ? 'text-emerald-600' : 'text-red-600'}`}>{grade}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-widest">Nota</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowResults(false); setAnswers({}); setCurrentIndex(0); setResults(null); }}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity glow-primary"
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.5} /> Repetir
              </button>
              <button
                onClick={() => router.push('/mode-select')}
                className="bg-muted/70 text-foreground px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Volver
              </button>
            </div>
          </motion.div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 'incorrect', 'correct'] as const).map((f: 'all' | 'correct' | 'incorrect') => (
              <button
                key={f}
                onClick={() => setReviewFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  reviewFilter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {f === 'all' ? `Todas (${results?.results?.length ?? 0})` :
                 f === 'incorrect' ? `Incorrectas (${(results?.results ?? []).filter((r: ResultItem) => !r?.isCorrect)?.length ?? 0})` :
                 `Correctas (${(results?.results ?? []).filter((r: ResultItem) => r?.isCorrect)?.length ?? 0})`}
              </button>
            ))}
          </div>

          {/* Review questions */}
          <div className="space-y-4">
            {(filteredResults ?? []).map((result: ResultItem, idx: number) => (
              <motion.div
                key={result?.questionId ?? idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                className={`glass rounded-2xl p-5 sm:p-6 border-l-4 ${
                  result?.isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    result?.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result?.isCorrect ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <X className="w-3.5 h-3.5" strokeWidth={2} />}
                  </span>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    <span className="text-muted-foreground">#{result?.questionNumber ?? 0}</span>{' '}
                    {result?.questionText ?? ''}
                  </p>
                </div>
                <div className="ml-9 space-y-1.5">
                  {['a', 'b', 'c', 'd'].map((letter: string) => {
                    const isUser = result?.userAnswer === letter
                    const isCorrectAnswer = result?.correctAnswer === letter
                    let classes = 'text-sm px-3 py-1.5 rounded-lg '
                    if (isCorrectAnswer) classes += 'bg-emerald-50/70 text-emerald-800 font-medium '
                    else if (isUser && !result?.isCorrect) classes += 'bg-red-50/70 text-red-800 line-through '
                    else classes += 'text-muted-foreground '

                    return (
                      <div key={letter} className={classes}>
                        <span className="font-mono font-bold mr-2">{letter?.toUpperCase?.() ?? ''})</span>
                        {getOptionText(result, letter)}
                        {isCorrectAnswer && <span className="ml-2 text-emerald-600">✓</span>}
                        {isUser && !isCorrectAnswer && <span className="ml-2 text-red-500">(tu respuesta)</span>}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const currentQuestion = questions?.[currentIndex]
  const totalQuestions = questions?.length ?? 0
  const answeredCount = Object.keys(answers ?? {})?.length ?? 0
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <main className="min-h-screen aurora-bg p-4 sm:p-6">
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/mode-select')}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/40"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Salir
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground">Práctica</span>
          </div>
          <span className="text-sm text-muted-foreground font-mono">{answeredCount}/{totalQuestions}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted/50 rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div
            className="bg-primary h-1.5 rounded-full"
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
              className="glass rounded-3xl p-6 sm:p-8 mb-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                  Pregunta {currentIndex + 1} de {totalQuestions}
                </span>
                <span className="text-xs text-muted-foreground font-mono">(#{currentQuestion?.number ?? 0})</span>
              </div>

              <p className="text-base sm:text-lg font-medium text-foreground mb-6 leading-relaxed">
                {currentQuestion?.questionText ?? ''}
              </p>

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
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/40 hover:bg-muted/70'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border'
                      }`}>
                        {letter?.toUpperCase?.() ?? ''}
                      </span>
                      <span className={`text-sm sm:text-base ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
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
            className="bg-muted/50 text-foreground px-4 py-2.5 rounded-xl font-medium inline-flex items-center gap-1.5 hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> Anterior
          </button>

          <button
            onClick={showAllAnswers}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors hidden sm:block"
          >
            Ver todas las respuestas correctas
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 glow-primary"
            >
              {submitting ? 'Enviando...' : 'Finalizar'}
              {!submitting && <Send className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity glow-primary"
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
                  ? 'bg-primary text-primary-foreground scale-110 shadow-sm'
                  : answers?.[q?.id ?? ''] 
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
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
