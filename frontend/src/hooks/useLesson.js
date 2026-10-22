import { useCallback, useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { useAcademyProgress } from './useAcademyProgress'
import {
  applySetup,
  buildDests,
  turnFromFen,
  validateMove,
} from '../utils/lessonValidator'


/**
 * Estado de uma licao: exercicio atual, tentativas, feedback.
 *
 * Nao gerencia navegacao entre licoes (isso e responsabilidade do AcademyView).
 */
export function useLesson(lesson, onBack) {
  const progress = useAcademyProgress()

  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [feedback, setFeedback] = useState(null)   // { status, message, expected }
  const [hintVisible, setHintVisible] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [boardKey, setBoardKey] = useState(0)

  const exercises = useMemo(() => lesson?.exercises || [], [lesson])
  const currentExercise = exercises[exerciseIndex] || null

  // FEN exibido: se o exercicio tem setup, aplica antes. Senao, usa o FEN puro.
  const displayFen = useMemo(() => {
    if (!currentExercise) return lesson?.demo?.fen || ''
    if (currentExercise.setup && currentExercise.setup.length > 0) {
      return applySetup(currentExercise.fen, currentExercise.setup)
    }
    return currentExercise.fen
  }, [currentExercise, lesson])

  // Destinos para o Chessground (dests do chess.js).
  const dests = useMemo(() => {
    if (!displayFen) return new Map()
    try {
      return buildDests(displayFen)
    } catch {
      return new Map()
    }
  }, [displayFen])

  // Cor da vez no tabuleiro.
  const turnColor = useMemo(() => {
    const t = turnFromFen(displayFen)
    return t === 'w' ? 'white' : 'black'
  }, [displayFen])

  // Reset quando troca de licao
  useEffect(() => {
    setExerciseIndex(0)
    setFeedback(null)
    setHintVisible(false)
    setDemoStep(0)
  }, [lesson?.id])

  // Reset quando troca de exercicio
  useEffect(() => {
    setFeedback(null)
    setHintVisible(false)
  }, [exerciseIndex])

  /**
   * Chamado pelo ChessBoard quando o usuario arrasta uma peca.
   */
  const tryMove = useCallback((from, to, promotion) => {
    if (!currentExercise) return

    const chess = new Chess(displayFen)
    const result = validateMove(chess, from, to, promotion, currentExercise.expected)

    // Registra a tentativa no progresso local (so se foi correct ou wrong;
    // illegal nao conta como tentativa real).
    if (result.status === 'correct') {
      progress.markExerciseAttempt(lesson.id, currentExercise.id, true)
      setFeedback({
        status: 'correct',
        message: currentExercise.success || 'Correto!',
        expected: result.expected,
      })
    } else if (result.status === 'wrong') {
      progress.markExerciseAttempt(lesson.id, currentExercise.id, false)
      setFeedback({
        status: 'wrong',
        message: currentExercise.failure || 'Nao e a solucao.',
        expected: result.expected,
      })
    } else {
      setFeedback({
        status: 'illegal',
        message: 'Lance ilegal.',
        expected: currentExercise.expected[0],
      })
    }
  }, [currentExercise, displayFen, lesson, progress])

  /**
   * Avanca para o proximo exercicio. Se for o ultimo, marca a licao
   * como concluida (mas so se todos os exercicios tiverem pelo menos
   * um acerto).
   */
  const nextExercise = useCallback(() => {
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1)
      return
    }
    progress.markLessonCompleted(lesson.id)
    if (onBack) onBack()
  }, [exerciseIndex, exercises.length, lesson, progress, onBack])

  const prevExercise = useCallback(() => {
    if (exerciseIndex > 0) setExerciseIndex((i) => i - 1)
  }, [exerciseIndex])

  /**
   * Tentar de novo o mesmo exercicio (limpa feedback, mantem mesma posicao).
   */
  const retryExercise = useCallback(() => {
    setFeedback(null)
    setBoardKey((k) => k + 1)
  }, [])

  /**
   * Revela a dica do exercicio atual.
   */
  const showHint = useCallback(() => {
    setHintVisible(true)
  }, [])

  /**
   * Demo: avanca um passo. Usado pelos controles de playback da demonstracao.
   */
  const demoNext = useCallback(() => {
    const total = lesson?.demo?.moves?.length || 0
    setDemoStep((s) => Math.min(total, s + 1))
  }, [lesson])

  const demoPrev = useCallback(() => {
    setDemoStep((s) => Math.max(0, s - 1))
  }, [])

  const demoReset = useCallback(() => {
    setDemoStep(0)
  }, [])

  // FEN da demo no passo atual.
  const demoFen = useMemo(() => {
    if (!lesson?.demo) return ''
    const chess = new Chess(lesson.demo.fen)
    const moves = lesson.demo.moves || []
    for (let i = 0; i < demoStep; i++) {
      try {
        const uci = moves[i]
        if (!uci) break
        const from = uci.substring(0, 2)
        const to = uci.substring(2, 4)
        const promo = uci.length > 4 ? uci.substring(4, 5) : undefined
        const m = promo
          ? chess.move({ from, to, promotion: promo })
          : chess.move({ from, to })
        if (!m) break
      } catch {
        break
      }
    }
    return chess.fen()
  }, [lesson, demoStep])

  const totalDemoSteps = lesson?.demo?.moves?.length || 0
  const isLastExercise = exerciseIndex === exercises.length - 1
  const lessonProgress = progress.getLessonProgress(lesson?.id)

  return {
    // Estado geral
    lesson,
    exercises,
    exerciseIndex,
    currentExercise,
    isLastExercise,
    totalExercises: exercises.length,

    // Tabuleiro
    displayFen,
    dests,
    turnColor,
    boardKey,

    // Feedback
    feedback,
    hintVisible,

    // Demo
    demoFen,
    demoStep,
    totalDemoSteps,

    // Progresso
    lessonProgress,

    // Acoes
    tryMove,
    nextExercise,
    prevExercise,
    retryExercise,
    showHint,
    demoNext,
    demoPrev,
    demoReset,
  }
}
