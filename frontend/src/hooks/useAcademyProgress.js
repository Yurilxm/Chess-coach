import { useCallback, useState } from 'react'

const STORAGE_KEY = 'chess-coach:academy-progress:v1'
const SCHEMA_VERSION = 1


function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyState()
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}


function emptyState() {
  return {
    version: SCHEMA_VERSION,
    lessons: {},
    exercises: {},
  }
}


function writeRaw(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}


export function useAcademyProgress() {
  const [version, setVersion] = useState(0)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const getState = useCallback(() => readRaw(), [version])

  /**
   * Marca uma licao como concluida.
   */
  const markLessonCompleted = useCallback((lessonId) => {
    if (!lessonId) return
    const state = readRaw()
    const prev = state.lessons[lessonId] || {}
    state.lessons[lessonId] = {
      ...prev,
      completed: true,
      completedAt: prev.completedAt || new Date().toISOString(),
    }
    writeRaw(state)
    bump()
  }, [bump])

  /**
   * Marca uma tentativa de exercicio (sucesso ou erro).
   * Incrementa contadores e mantem data da ultima tentativa.
   */
  const markExerciseAttempt = useCallback((lessonId, exerciseId, success) => {
    if (!lessonId || !exerciseId) return
    const state = readRaw()
    const key = `${lessonId}::${exerciseId}`
    const prev = state.exercises[key] || { attempts: 0, correct: 0, wrong: 0 }
    state.exercises[key] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (success ? 1 : 0),
      wrong: prev.wrong + (success ? 0 : 1),
      lastAttempt: new Date().toISOString(),
    }
    writeRaw(state)
    bump()
  }, [bump])

  /**
   * Devolve o progresso de uma licao (ou null se nunca foi aberta).
   */
  const getLessonProgress = useCallback((lessonId) => {
    const state = readRaw()
    return state.lessons[lessonId] || null
  }, [version])

  /**
   * Devolve as estatisticas de um exercicio especifico.
   */
  const getExerciseStats = useCallback((lessonId, exerciseId) => {
    const state = readRaw()
    return state.exercises[`${lessonId}::${exerciseId}`] || null
  }, [version])

  const resetAll = useCallback(() => {
    writeRaw(emptyState())
    bump()
  }, [bump])

  return {
    getState,
    markLessonCompleted,
    markExerciseAttempt,
    getLessonProgress,
    getExerciseStats,
    resetAll,
  }
}
