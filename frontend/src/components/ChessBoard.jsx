import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import './ChessBoard.css'

/**
 * Componente "burro": apenas espelha visualmente o estado que recebe via
 * props. Toda a lógica de regras de xadrez vive nos hooks useChessGame /
 * useChessEditor. Isso é proposital: ao não guardar nenhuma instância de
 * Chess.js aqui dentro, o tabuleiro nunca pode "misturar" Jogo e Editor.
 */
function ChessBoard({
  fen,
  orientation = 'white',
  boardWidth = 520,
  turnColor,
  check = false,
  lastMove,
  movableColor,
  freeMove = false,
  dests,
  showDests = true,
  autoShapes = [],
  onAfterMove,
  className = '',
}) {
  const boardRef = useRef(null)
  const apiRef = useRef(null)
  const onAfterMoveRef = useRef(onAfterMove)
  onAfterMoveRef.current = onAfterMove

  const autoCastle = !freeMove

  const buildConfig = () => ({
    fen,
    orientation,
    turnColor,
    check,
    lastMove,
    coordinates: true,
    autoCastle,
    highlight: { lastMove: true, check: true },
    animation: { enabled: true, duration: 150 },
    drawable: { enabled: true, visible: true, autoShapes },
    movable: {
      free: freeMove,
      color: movableColor,
      dests,
      showDests,
      events: {
        after: (orig, dest) => onAfterMoveRef.current?.(orig, dest),
      },
    },
  })

  // Inicializa o Chessground uma única vez
  useEffect(() => {
    if (!boardRef.current || apiRef.current) return
    apiRef.current = Chessground(boardRef.current, buildConfig())
    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantém o Chessground sincronizado com o que vem de fora
  useEffect(() => {
    apiRef.current?.set(buildConfig())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation, turnColor, check, lastMove, freeMove, movableColor, dests, showDests, autoShapes])

  return (
    <div
      className={`relative rounded-2xl p-[2px] bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent shadow-2xl shadow-black/50 ring-1 ring-white/10 ${className}`}
    >
      <div
        ref={boardRef}
        style={{ width: boardWidth, height: boardWidth }}
        className="rounded-[14px] overflow-hidden"
      />
    </div>
  )
}

export default ChessBoard