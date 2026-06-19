import { useCallback, useRef, useState } from 'react'
import { createChess, START_FEN, EMPTY_FEN } from '../utils/chessHelpers'

/**
 * Estado e lógica do Modo Editor. Cada chamada deste hook cria sua própria
 * instância de Chess — não compartilha nada com o Modo Jogo.
 */
export function useChessEditor(initialFen) {
  const chessRef = useRef(createChess(initialFen))
  const [fen, setFen] = useState(chessRef.current.fen())

  const sync = useCallback(() => setFen(chessRef.current.fen()), [])

  const movePiece = useCallback((from, to) => {
    const chess = chessRef.current
    const piece = chess.get(from)
    if (!piece) return
    chess.remove(from)
    chess.remove(to)
    chess.put({ type: piece.type, color: piece.color }, to)
    sync()
  }, [sync])

  const placePiece = useCallback((square, type, color) => {
    const chess = chessRef.current
    chess.remove(square)
    chess.put({ type, color }, square)
    sync()
  }, [sync])

  const removePiece = useCallback((square) => {
    chessRef.current.remove(square)
    sync()
  }, [sync])

  const setSideToMove = useCallback((color) => {
    const chess = chessRef.current
    const parts = chess.fen().split(' ')
    parts[1] = color
    try {
      chess.load(parts.join(' '))
      sync()
    } catch {
      // combinação inválida (ex: posição ilegal): ignora
    }
  }, [sync])

  const reset = useCallback((fenToLoad) => {
    chessRef.current = createChess(fenToLoad || START_FEN)
    sync()
  }, [sync])

  const clear = useCallback(() => {
    chessRef.current = createChess(EMPTY_FEN)
    sync()
  }, [sync])

  const loadFen = useCallback((newFen) => {
    if (!newFen || newFen === chessRef.current.fen()) return
    try {
      chessRef.current.load(newFen)
      sync()
    } catch {
      // FEN inválido: ignora
    }
  }, [sync])

  const chess = chessRef.current

  return {
    fen,
    turn: chess.turn(),
    movePiece,
    placePiece,
    removePiece,
    setSideToMove,
    reset,
    clear,
    loadFen,
  }
}