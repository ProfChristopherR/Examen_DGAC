'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Check, X, ArrowLeft, Send, RotateCcw, Trophy, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getUser, addHistory, savePracticeProgress, loadPracticeProgress, clearPracticeProgress } from '@/lib/storage'
import { splitQuestionLines } from '@/lib/format-question'

interface Question {
  id: string
  number: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
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
    return <p className="text-base sm:text-lg font-medium text-foreground mb-6 leading-relaxed">{text}</p>
  }
  return (
    <div className="text-base sm:text-lg font-medium text-foreground mb-6 leading-relaxed space-y-2">
      {lines.map((line, i) => (
        <p key={i} className={i === 0 ? '' : 'pl-0'}>{line}</p>
      ))}
    </div>
  )
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
    const user = getUser()
    if (!user) {
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
      // Restore progress
      const progress = loadPracticeProgress()
      if (Object.keys(progress.answers).length > 0) {
        setAnswers(progress.answers)
        setCurrentIndex(progress.index)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Error de conexión al cargar preguntas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    savePracticeProgress(answers, currentIndex)
  }, [answers, currentIndex])

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
      const gradeStr = grade.toFixed(1).replace('.', ',')

      setResults({
        success: true,
        correctCount,
        totalQuestions: totalCount,
        percentage,
        grade: gradeStr,
        results: resultsArr
      })
      setShowResults(true)
      clearPracticeProgress()

      // Save to history
      const user = getUser()
      if (user) {
        addHistory({
          type: 'practice',
          score: correctCount,
          total: totalCount,
          percentage,
          grade: gradeStr,
          userName: user.name,
          userEmail: user.email,
        })
      }
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
    clearPracticeProgress()

    const user = getUser()
    if (user) {
      addHistory({
        type: 'practice',
        score: totalCount,
        total: totalCount,
        percentage: 100,
        grade: '7,0',
        userName: user.name,
        userEmail: user.email,
      })
    }
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
      <main className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando preguntas...</p>
        </div>
      </main>
    )
  }

  if (showResults && results) {
    const percentage = results?.percentage ?? 0
    const grade = results?.grade ?? 0
    const approved = percentage >= 60

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
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-white">
              {approved ? '¡Felicidades!' : 'Sigue practicando'}
            </h1>
            <p className="text-slate-400 mb-8">Resultados del modo práctica</p>

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

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowResults(false); setAnswers({}); setCurrentIndex(0); setResults(null); clearPracticeProgress(); }}
                className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.5} /> Repetir
              </button>
              <button
                onClick={() => { clearPracticeProgress(); router.push('/mode-select') }}
                className="bg-white/[0.05] text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-white/[0.08] transition-colors border border-white/[0.08]"
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
                  reviewFilter === f ? 'bg-cyan-500 text-white shadow-sm' : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
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
                className={`rounded-2xl p-5 sm:p-6 border-l-4 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl ${
                  result?.isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    result?.isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {result?.isCorrect ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <X className="w-3.5 h-3.5" strokeWidth={2} />}
                  </span>
                  <div className="text-sm font-medium text-white leading-relaxed space-y-1">
                    <p>
                      <span className="text-slate-500">#{result?.questionNumber ?? 0}</span>{' '}
                      {splitQuestionLines(result?.questionText ?? '').map((line, li) => (
                        <span key={li} className="block">{line}</span>
                      ))}
                    </p>
                  </div>
                </div>
                <div className="ml-9 space-y-1.5">
                  {['a', 'b', 'c', 'd'].map((letter: string) => {
                    const isUser = result?.userAnswer === letter
                    const isCorrectAnswer = result?.correctAnswer === letter
                    let classes = 'text-sm px-3 py-1.5 rounded-lg '
                    if (isCorrectAnswer) classes += 'bg-emerald-500/10 text-emerald-300 font-medium '
                    else if (isUser && !result?.isCorrect) classes += 'bg-red-500/10 text-red-300 line-through '
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
            onClick={() => { clearPracticeProgress(); router.push('/mode-select') }}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Salir
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-white">Práctica</span>
          </div>
          <span className="text-sm text-slate-500 font-mono">{answeredCount}/{totalQuestions}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div
            className="bg-cyan-500 h-1.5 rounded-full"
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
                <span className="bg-cyan-500/10 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">
                  Pregunta {currentIndex + 1} de {totalQuestions}
                </span>
                <span className="text-xs text-slate-500 font-mono">(#{currentQuestion?.number ?? 0})</span>
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
                          ? 'border-cyan-500 bg-cyan-500/5'
                          : 'border-transparent bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected ? 'bg-cyan-500 text-white' : 'bg-[#0a0a0f] text-slate-400 border border-white/[0.08]'
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

          <button
            onClick={showAllAnswers}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors hidden sm:block"
          >
            Ver todas las respuestas correctas
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {submitting ? 'Enviando...' : 'Finalizar'}
              {!submitting && <Send className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
              className="bg-cyan-500 text-white px-4 py-2.5 rounded-xl font-medium inline-flex items-center gap-1.5 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
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
                  ? 'bg-cyan-500 text-white scale-110 shadow-sm'
                  : answers?.[q?.id ?? '']
                    ? 'bg-cyan-500/15 text-cyan-300'
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
