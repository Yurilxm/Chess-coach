import { useCallback, useRef, useState } from 'react'
import { createChess, START_FEN, buildDests, computeEditorDests, applyVirtualMove } from '../utils/chessHelpers'

export function useChessGame(initialFen) {
  const chessRef = useRef(createChess(initialFen))
  const [fen, setFen] = useState(chessRef.current.fen())
  const [history, setHistory] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [pendingPromotion, setPendingPromotion] = useState(null)
  const [playerColor, setPlayerColor] = useState(null)

  // Fila de pré-jogadas. Em vez de guardar só UMA pré-jogada (que era
  // sobrescrita a cada novo clique), guardamos uma lista: a primeira da
  // fila é executada quando chega a vez do jogador, e assim por diante.
  const [premoveQueue, setPremoveQueue] = useState([])
  const premoveQueueRef = useRef([])

  const refreshFromChess = useCallback(() => {
    const chess = chessRef.current
    setFen(chess.fen())
    setHistory(chess.history({ verbose: true }))
  }, [])

  const getGameOverReason = useCallback(() => {
    const chess = chessRef.current
    if (chess.isCheckmate()) return 'checkmate'
    if (chess.isStalemate()) return 'stalemate'
    if (chess.isInsufficientMaterial()) return 'insufficient'
    const fenParts = chess.fen().split(' ')
    const halfMoves = parseInt(fenParts[4], 10) || 0
    if (halfMoves >= 100) return 'fiftyMoves'
    if (chess.isThreefoldRepetition()) return 'threefold'
    if (chess.isDraw()) return 'draw'
    if (chess.isGameOver() && !chess.isCheck()) return 'stalemate'
    if (chess.isGameOver() && chess.isCheck()) return 'checkmate'
    return null
  }, [])

  const syncPremoveQueue = useCallback((next) => {
    premoveQueueRef.current = next
    setPremoveQueue(next)
  }, [])

  // Adiciona uma pré-jogada ao final da fila
  const addPremove = useCallback((from, to, promotion) => {
    syncPremoveQueue([...premoveQueueRef.current, { from, to, promotion: promotion || 'q' }])
  }, [syncPremoveQueue])

  // Remove só a última pré-jogada enfileirada (útil para um botão de "desfazer pré-jogada")
  const removeLastPremove = useCallback(() => {
    syncPremoveQueue(premoveQueueRef.current.slice(0, -1))
  }, [syncPremoveQueue])

  // Limpa toda a fila de pré-jogadas
  const clearPremoves = useCallback(() => {
    syncPremoveQueue([])
  }, [syncPremoveQueue])

  // Destinos válidos para a PRÓXIMA pré-jogada: projeta a posição atual real
  // + todas as pré-jogadas já enfileiradas (aplicadas virtualmente, sem
  // validação de turno/xeque), e então calcula o padrão de movimento de
  // cada peça do jogador com computeEditorDests (que respeita o jeito que
  // cada peça se move, mas não depende de "de quem é a vez"). Isso resolve
  // o bug do peão "andando pro lado": antes os destinos vinham de
  // buildDests(chess), que usa chess.moves() — ou seja, os lances de quem
  // TEM a vez agora (o bot), não os do jogador.
  const getPremoveDests = useCallback(() => {
    if (!playerColor) return new Map()

    const virtual = createChess(chessRef.current.fen())
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
  }, [playerColor])

  // Tira a primeira pré-jogada da fila e tenta executá-la como um lance
  // REAL e validado (chess.move). Se a posição mudou e ela deixou de ser
  // legal (ex: o bot capturou a peça envolvida), a fila inteira é
  // descartada, porque o "plano" do jogador não é mais válido.
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
    premoveQueue,
    addPremove,
    removeLastPremove,
    clearPremoves,
    executeNextPremove,
    getPremoveDests,
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