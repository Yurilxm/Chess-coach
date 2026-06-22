import { useCallback, useRef, useState } from 'react'
import { createChess, START_FEN, buildDests } from '../utils/chessHelpers'

export function useChessGame(initialFen) {
  const chessRef = useRef(createChess(initialFen))
  const [fen, setFen] = useState(chessRef.current.fen())
  const [history, setHistory] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [pendingPromotion, setPendingPromotion] = useState(null)
  const [playerColor, setPlayerColor] = useState(null)

  const refreshFromChess = useCallback(() => {
    const chess = chessRef.current
    setFen(chess.fen())
    setHistory(chess.history({ verbose: true }))
  }, [])

  const getGameOverReason = useCallback(() => {
    const chess = chessRef.current
    if (!chess.isGameOver()) return null
    if (chess.isCheckmate()) return 'checkmate'
    if (chess.isStalemate()) return 'stalemate'
    if (chess.isThreefoldRepetition()) return 'threefold'
    if (chess.isInsufficientMaterial()) return 'insufficient'
    const fenParts = chess.fen().split(' ')
    const halfMoves = parseInt(fenParts[4], 10)
    if (halfMoves >= 100) return 'fiftyMoves'
    if (chess.isDraw()) return 'draw'
    return 'gameOver'
  }, [])

  const attemptMove = useCallback((from, to, options = {}) => {
    const chess = chessRef.current
    const piece = chess.get(from)
    
    // Só verifica cor se não for skipColorCheck (usado pelo bot)
    if (!options.skipColorCheck && playerColor && piece?.color !== playerColor) {
      return { illegal: true }
    }

    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))

    if (isPromotion && !options.skipColorCheck) {
      setPendingPromotion({ from, to, color: chess.turn() })
      return { needsPromotion: true }
    }

    try {
      const move = chess.move({ from, to, promotion: options.promotion || 'q' })
      if (move) {
        setLastMove([from, to])
        refreshFromChess()
        return { move }
      }
    } catch {
      // lance ilegal
    }
    return { illegal: true }
  }, [refreshFromChess, playerColor])

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
      // FEN inválido
    }
  }, [refreshFromChess])

  const chess = chessRef.current

  return {
    fen,
    history,
    lastMove,
    pendingPromotion,
    playerColor,
    setPlayerColor,
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    gameOverReason: getGameOverReason(),
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isThreefoldRepetition: chess.isThreefoldRepetition(),
    isInsufficientMaterial: chess.isInsufficientMaterial(),
    halfMoves: parseInt(chess.fen().split(' ')[4], 10) || 0,
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