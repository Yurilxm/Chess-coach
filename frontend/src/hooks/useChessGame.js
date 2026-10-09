import { useCallback, useRef, useState } from 'react'
import { createChess, START_FEN, buildDests, computeEditorDests, applyVirtualMove } from '../utils/chessHelpers'


function getGameOverReason(chess) {
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isInsufficientMaterial()) return 'insufficient'
  const fenParts = chess.fen().split(' ')
  const halfMoves = parseInt(fenParts[4], 10) || 0
  if (halfMoves >= 100) return 'fiftyMoves'
  if (chess.isThreefoldRepetition()) return 'threefold'
  if (chess.isDraw()) return 'draw'
  // Fallback: game over sem xeque que nao caiu em nenhuma categoria
  // especifica acima (ex: dead position rara). Antes retornava
  // 'stalemate', que tem semantica propria (afogamento) — o texto
  // exibido ficava errado. Agora retorna 'draw' generico.
  if (chess.isGameOver() && !chess.isCheck()) return 'draw'
  if (chess.isGameOver() && chess.isCheck()) return 'checkmate'
  return null
}


function computeDerived(chess) {
  // Todos os valores derivados do board, calculados de uma vez. Chamado
  // so dentro de callbacks (refreshFromChess), nunca no render — por isso
  // ler do ref aqui e seguro e nao dispara o warning react-hooks/refs.
  return {
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    gameOverReason: getGameOverReason(chess),
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isThreefoldRepetition: chess.isThreefoldRepetition(),
    isInsufficientMaterial: chess.isInsufficientMaterial(),
    halfMoves: parseInt(chess.fen().split(' ')[4], 10) || 0,
  }
}


export function useChessGame(initialFen) {
  const chessRef = useRef(createChess(initialFen || START_FEN))

  const [fen, setFen] = useState(() => createChess(initialFen || START_FEN).fen())
  const [history, setHistory] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [pendingPromotion, setPendingPromotion] = useState(null)
  const [playerColor, setPlayerColor] = useState(null)
  const [derived, setDerived] = useState(() => computeDerived(createChess(initialFen || START_FEN)))

  // Fila de pre-jogadas. Em vez de guardar so UMA pre-jogada (que era
  // sobrescrita a cada novo clique), guardamos uma lista.
  const [premoveQueue, setPremoveQueue] = useState([])
  const premoveQueueRef = useRef([])

  const refreshFromChess = useCallback(() => {
    const chess = chessRef.current
    setFen(chess.fen())
    setHistory(chess.history({ verbose: true }))
    setDerived(computeDerived(chess))
  }, [])

  const syncPremoveQueue = useCallback((next) => {
    premoveQueueRef.current = next
    setPremoveQueue(next)
  }, [])

  const addPremove = useCallback((from, to, promotion) => {
    syncPremoveQueue([...premoveQueueRef.current, { from, to, promotion: promotion || 'q' }])
  }, [syncPremoveQueue])

  const removeLastPremove = useCallback(() => {
    syncPremoveQueue(premoveQueueRef.current.slice(0, -1))
  }, [syncPremoveQueue])

  const clearPremoves = useCallback(() => {
    syncPremoveQueue([])
  }, [syncPremoveQueue])

  // Usa `fen` (state) em vez de chessRef.current: dentro do render
  // nao pode tocar em ref. O `fen` esta sempre sincronizado com o board
  // real (refreshFromChess atualiza ambos).
  const getPremoveDests = useCallback(() => {
    if (!playerColor) return new Map()

    const virtual = createChess(fen)
    for (const pm of premoveQueueRef.current) {
      applyVirtualMove(virtual, pm.from, pm.to, pm.promotion)
    }

    const allDests = computeEditorDests(virtual)
    const filtered = new Map()
    for (const [square, targets] of allDests) {
      const piece = virtual.get(square)
      if (piece?.color === playerColor) filtered.set(square, targets)
    }
    return filtered
  }, [fen, playerColor])

  const executeNextPremove = useCallback(() => {
    const queue = premoveQueueRef.current
    if (queue.length === 0) return null

    const [next, ...rest] = queue
    const chess = chessRef.current
    const piece = chess.get(next.from)

    if (!piece || (playerColor && piece.color !== playerColor)) {
      syncPremoveQueue([])
      return null
    }

    try {
      const move = chess.move({ from: next.from, to: next.to, promotion: next.promotion || 'q' })
      if (move) {
        syncPremoveQueue(rest)
        setLastMove([next.from, next.to])
        refreshFromChess()
        return { move, gameOver: chess.isGameOver() }
      }
    } catch {
      // Lance deixou de ser legal
    }

    syncPremoveQueue([])
    return null
  }, [refreshFromChess, playerColor, syncPremoveQueue])

  const attemptMove = useCallback((from, to, options = {}) => {
    const chess = chessRef.current
    const piece = chess.get(from)

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
        return { move, gameOver: chess.isGameOver() }
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
    let move
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
    clearPremoves()
    refreshFromChess()
  }, [refreshFromChess, clearPremoves])

  const loadFen = useCallback((newFen) => {
    if (!newFen || newFen === chessRef.current.fen()) return
    try {
      chessRef.current.load(newFen)
      setLastMove(null)
      refreshFromChess()
    } catch {
      // FEN invalido
    }
  }, [refreshFromChess])

  const getDests = useCallback(() => {
    return buildDests(createChess(fen))
  }, [fen])

  return {
    fen,
    history,
    lastMove,
    pendingPromotion,
    playerColor,
    setPlayerColor,
    premoveQueue,
    addPremove,
    removeLastPremove,
    clearPremoves,
    executeNextPremove,
    getPremoveDests,
    turn: derived.turn,
    isGameOver: derived.isGameOver,
    gameOverReason: derived.gameOverReason,
    isCheck: derived.isCheck,
    isCheckmate: derived.isCheckmate,
    isStalemate: derived.isStalemate,
    isThreefoldRepetition: derived.isThreefoldRepetition,
    isInsufficientMaterial: derived.isInsufficientMaterial,
    halfMoves: derived.halfMoves,
    moveCount: Math.ceil(history.length / 2),
    attemptMove,
    resolvePromotion,
    cancelPromotion,
    undo,
    reset,
    loadFen,
    getDests,
  }
}
