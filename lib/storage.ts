export interface HistoryEntry {
  id: string
  type: 'practice' | 'evaluation'
  date: string
  score: number
  total: number
  percentage: number
  grade: string
  userName: string
  userEmail: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  googleSub?: string
  picture?: string
}

const KEYS = {
  USER: 'rpas_user_profile',
  HISTORY: 'rpas_history',
  PRACTICE_ANSWERS: 'rpas_practice_answers',
  PRACTICE_INDEX: 'rpas_practice_index',
  EVAL_QUESTIONS: 'rpas_eval_questions',
  EVAL_ANSWERS: 'rpas_eval_answers',
  EVAL_INDEX: 'rpas_eval_index',
  EVAL_SUBMITTED: 'rpas_eval_submitted',
  EVAL_RESULTS: 'rpas_eval_results',
  EVAL_EMAIL_SENT: 'rpas_eval_email_sent',
}

/* ---------- User ---------- */

export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEYS.USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUser(user: UserProfile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.USER, JSON.stringify(user))
  // Legacy support
  localStorage.setItem('rpas_user_id', user.id)
  localStorage.setItem('rpas_user_name', user.name)
  localStorage.setItem('rpas_user_email', user.email)
}

export function clearUser() {
  if (typeof window === 'undefined') return
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}

/* ---------- History ---------- */

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEYS.HISTORY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'date'>) {
  if (typeof window === 'undefined') return
  const history = getHistory()
  const newEntry: HistoryEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString(),
  }
  history.unshift(newEntry)
  // Mantener máximo 50 entradas
  if (history.length > 50) history.pop()
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history))
}

export function clearHistory() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.HISTORY)
}

/* ---------- Progress helpers ---------- */

export function savePracticeProgress(answers: Record<string, string>, index: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.PRACTICE_ANSWERS, JSON.stringify(answers))
  localStorage.setItem(KEYS.PRACTICE_INDEX, String(index))
}

export function loadPracticeProgress(): { answers: Record<string, string>; index: number } {
  if (typeof window === 'undefined') return { answers: {}, index: 0 }
  try {
    const answers = JSON.parse(localStorage.getItem(KEYS.PRACTICE_ANSWERS) || '{}')
    const index = parseInt(localStorage.getItem(KEYS.PRACTICE_INDEX) || '0', 10)
    return { answers: answers || {}, index: isNaN(index) ? 0 : index }
  } catch {
    return { answers: {}, index: 0 }
  }
}

export function clearPracticeProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.PRACTICE_ANSWERS)
  localStorage.removeItem(KEYS.PRACTICE_INDEX)
}

/* ---------- Export / Import ---------- */

export interface ExportData {
  version: 1
  exportedAt: string
  user: UserProfile | null
  history: HistoryEntry[]
  practiceAnswers: Record<string, string>
  practiceIndex: number
}

export function exportData(): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: getUser(),
    history: getHistory(),
    practiceAnswers: loadPracticeProgress().answers,
    practiceIndex: loadPracticeProgress().index,
  }
  return JSON.stringify(data, null, 2)
}

export function importData(json: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(json)
    if (data.version !== 1) {
      return { success: false, message: 'Formato de archivo no compatible.' }
    }
    if (data.user) {
      setUser(data.user)
    }
    if (Array.isArray(data.history)) {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(data.history))
    }
    if (data.practiceAnswers) {
      localStorage.setItem(KEYS.PRACTICE_ANSWERS, JSON.stringify(data.practiceAnswers))
    }
    if (typeof data.practiceIndex === 'number') {
      localStorage.setItem(KEYS.PRACTICE_INDEX, String(data.practiceIndex))
    }
    return { success: true, message: `Datos importados correctamente. ${data.history?.length || 0} ensayos restaurados.` }
  } catch {
    return { success: false, message: 'El archivo no es un JSON válido.' }
  }
}

/* ---------- Eval ---------- */

export function clearEvalStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.EVAL_QUESTIONS)
  localStorage.removeItem(KEYS.EVAL_ANSWERS)
  localStorage.removeItem(KEYS.EVAL_INDEX)
  localStorage.removeItem(KEYS.EVAL_SUBMITTED)
  localStorage.removeItem(KEYS.EVAL_RESULTS)
  localStorage.removeItem(KEYS.EVAL_EMAIL_SENT)
}
