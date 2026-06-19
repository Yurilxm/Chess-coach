import { useCallback, useRef, useState } from 'react'
import { createChess, START_FEN, buildDests } from '../utils/chessHelpers'

/**
 * Estado e lógica do Modo Jogo. Cada chamada deste hook cria sua própria
 * instância de Chess — não compartilha nada com o Modo Editor.
 */
export function useChessGame(initialFen) {
  const chessRef = useRef(createChess(initialFen))
  const [fen, setFen] = useState(chessRef.current.fen())
  const [history, setHistory] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [pendingPromotion, setPendingPromotion] = useState(null)

  const refreshFromChess = useCallback(() => {
    const chess = chessRef.current
    setFen(chess.fen())
    setHistory(chess.history({ verbose: true }))
  }, [])

  const attemptMove = useCallback((from, to) => {
    const chess = chessRef.current
    const piece = chess.get(from)
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))

    if (isPromotion) {
      setPendingPromotion({ from, to, color: chess.turn() })
      return { needsPromotion: true }
    }

    try {
      const move = chess.move({ from, to, promotion: 'q' })
      if (move) {
        setLastMove([from, to])
        refreshFromChess()
        return { move }
      }
    } catch {
      // lance ilegal: ignora silenciosamente
    }
    return { illegal: true }
  }, [refreshFromChess])

  const resolvePromotion = useCallback((promotionCode) => {
    if (!pendingPromotion) return null
    const chess = chessRef.current
    const { from, to } = pendingPromotion
    let move = null
    try {
      move = chess.move({ from, to, promotion: promotionCode })
    } catch {
      move = null
    }
    setPendingPromotion(null)
    if (move) {
      setLastMove([from, to])
      refreshFromChess()
    }
    return move
  }, [pendingPromotion, refreshFromChess])

  const cancelPromotion = useCallback(() => setPendingPromotion(null), [])

  const undo = useCallback(() => {
    const undone = chessRef.current.undo()
    if (undone) {
      setLastMove(null)
      refreshFromChess()
    }
    return undone
  }, [refreshFromChess])

  const reset = useCallback((fenToLoad) => {
    chessRef.current = createChess(fenToLoad || START_FEN)
    setLastMove(null)
    setPendingPromotion(null)
    refreshFromChess()
  }, [refreshFromChess])

  const loadFen = useCallback((newFen) => {
    if (!newFen || newFen === chessRef.current.fen()) return
    try {
      chessRef.current.load(newFen)
      setLastMove(null)
      refreshFromChess()
    } catch {
      // FEN inválido: ignora
    }
  }, [refreshFromChess])

  const chess = chessRef.current

  return {
    fen,
    history,
    lastMove,
    pendingPromotion,
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    isCheck: chess.isCheck(),
    moveCount: Math.ceil(history.length / 2),
    attemptMove,
    resolvePromotion,
    cancelPromotion,
    undo,
    reset,
    loadFen,
    getDests: () => buildDests(chess),
  }
}