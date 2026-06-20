import { useCallback, useRef, useState } from 'react'
import { createChess, START_FEN } from '../utils/chessHelpers'
import { computeEditorDests } from '../utils/pieceMovement'

const MAX_HISTORY = 50

export function useChessEditor(initialFen) {
  const chessRef = useRef(null)
  if (chessRef.current === null) {
    chessRef.current = createChess(initialFen || START_FEN)
  }
  
  const historyRef = useRef([])
  
  const [fen, setFen] = useState(() => chessRef.current.fen())
  const [canUndo, setCanUndo] = useState(false)

  const sync = useCallback(() => {
    setFen(chessRef.current.fen())
    setCanUndo(historyRef.current.length > 0)
  }, [])

  const pushHistory = useCallback(() => {
    historyRef.current.push(chessRef.current.fen())
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
  }, [])

  const movePiece = useCallback((from, to) => {
    const chess = chessRef.current
    const piece = chess.get(from)
    if (!piece) return
    pushHistory()
    chess.remove(from)
    chess.remove(to)
    chess.put({ type: piece.type, color: piece.color }, to)
    sync()
  }, [sync, pushHistory])

  const placePiece = useCallback((square, type, color) => {
    pushHistory()
    const chess = chessRef.current
    chess.remove(square)
    chess.put({ type, color }, square)
    sync()
  }, [sync, pushHistory])

  const removePiece = useCallback((square) => {
    pushHistory()
    chessRef.current.remove(square)
    sync()
  }, [sync, pushHistory])

  const setSideToMove = useCallback((color) => {
    const chess = chessRef.current
    const parts = chess.fen().split(' ')
    parts[1] = color
    pushHistory()
    try {
      chess.load(parts.join(' '), { skipValidation: true })
      sync()
    } catch {
      historyRef.current.pop()
    }
  }, [sync, pushHistory])

  const reset = useCallback((fenToLoad) => {
    pushHistory()
    chessRef.current = createChess(fenToLoad || START_FEN)
    sync()
  }, [sync, pushHistory])

  const loadFen = useCallback((newFen) => {
    if (!newFen || newFen === chessRef.current.fen()) return
    pushHistory()
    try {
      chessRef.current.load(newFen, { skipValidation: true })
      sync()
    } catch {
      historyRef.current.pop()
    }
  }, [sync, pushHistory])

  const undo = useCallback(() => {
    const previousFen = historyRef.current.pop()
    if (!previousFen) return false
    chessRef.current.load(previousFen, { skipValidation: true })
    sync()
    return true
  }, [sync])

  const chess = chessRef.current

  return {
    fen,
    turn: chess.turn(),
    canUndo,
    movePiece,
    placePiece,
    removePiece,
    setSideToMove,
    reset,
    loadFen,
    undo,
    getDests: () => computeEditorDests(chess.board()),
  }
}