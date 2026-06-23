import { useMemo, useState } from 'react'
import ChessBoard from './ChessBoard'
import MoveHistoryPanel from './MoveHistoryPanel'
import PromotionModal from './PromotionModal'
import SecondaryButton from './SecondaryButton'
import TurnBadge from './TurnBadge'
import CapturedPieces from './CapturedPieces'
import OpeningBadge from './OpeningBadge'
import { getCapturedPieces } from '../utils/chessHelpers'
import { detectOpening } from '../utils/openings'
import { RefreshCw, Undo2, RotateCcw } from 'lucide-react'

function GameView({ game, boardWidth = 520, bestMoveUci, isBotMode = false, onBotReset }) {
  const [orientation, setOrientation] = useState('white')

  const autoShapes = useMemo(() => (
    bestMoveUci && bestMoveUci.length >= 4
      ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
      : []
  ), [bestMoveUci])

  const captured = useMemo(() => getCapturedPieces(game.history), [game.history])
  
  // Abertura só aparece nos primeiros 10 lances (20 meios-lances)
  const opening = useMemo(() => {
    if (game.history.length > 20) return null
    return detectOpening(game.history)
  }, [game.history])

  function handleAfterMove(orig, dest) {
    game.attemptMove(orig, dest)
  }

  function handleFlip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  const moveLabel = game.moveCount > 0 ? `Lance ${game.moveCount}` : 'Início da partida'
  const whiteCaptured = captured.byWhite
  const blackCaptured = captured.byBlack
  const hasCapturedPieces = whiteCaptured.length > 0 || blackCaptured.length > 0

  const boardOrientation = isBotMode 
    ? (game.playerColor === 'b' ? 'black' : 'white')
    : orientation

  const movableColor = isBotMode
    ? (game.playerColor === 'w' ? 'white' : 'black')
    : (game.isGameOver ? undefined : (game.turn === 'w' ? 'white' : 'black'))

  const showDests = isBotMode 
    ? (game.turn === game.playerColor && !game.isGameOver)
    : true

  const dests = (game.isGameOver || (isBotMode && game.turn !== game.playerColor))
    ? new Map() 
    : game.getDests()

  function handleReset() {
    if (isBotMode && onBotReset) {
      onBotReset()
    } else {
      game.reset()
    }
  }

  const botLabel = isBotMode && game.playerColor 
    ? `Jogando de ${game.playerColor === 'w' ? 'brancas' : 'pretas'}`
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      <TurnBadge 
        turn={game.turn} 
        moveLabel={moveLabel} 
        gameOver={game.isGameOver} 
        gameOverReason={game.gameOverReason}
        botLabel={botLabel}
      />
      
      <OpeningBadge opening={opening} />

      <div className="relative" style={{ width: boardWidth, paddingBottom: hasCapturedPieces ? '10px' : '0' }}>
        <div className="absolute -top-6 right-0">
          <CapturedPieces pieces={blackCaptured} color="w" />
        </div>

        <ChessBoard
          fen={game.fen}
          orientation={boardOrientation}
          boardWidth={boardWidth}
          turnColor={game.turn === 'w' ? 'white' : 'black'}
          check={game.isCheck}
          lastMove={game.lastMove}
          movableColor={movableColor}
          freeMove={false}
          dests={dests}
          showDests={showDests}
          autoShapes={autoShapes}
          onAfterMove={handleAfterMove}
        />

        <div className="absolute -bottom-6 left-0">
          <CapturedPieces pieces={whiteCaptured} color="b" />
        </div>
      </div>

      {/* Modo Normal: Nova partida + Desfazer + Girar */}
      {!isBotMode && (
        <div className={`flex gap-2 ${hasCapturedPieces ? 'mt-5' : ''}`}>
          <SecondaryButton icon={RefreshCw} onClick={handleReset}>
            Nova partida
          </SecondaryButton>
          <SecondaryButton icon={Undo2} onClick={() => game.undo()} disabled={game.history.length === 0}>
            Desfazer
          </SecondaryButton>
          <SecondaryButton icon={RotateCcw} onClick={handleFlip}>
            Girar tabuleiro
          </SecondaryButton>
        </div>
      )}

      {/* Histórico com margem adequada */}
      <div className={`w-full ${hasCapturedPieces ? 'mt-3' : ''}`}>
        <MoveHistoryPanel history={game.history} />
      </div>

      {game.pendingPromotion && (
        <PromotionModal
          color={game.pendingPromotion.color}
          onChoose={game.resolvePromotion}
          onCancel={game.cancelPromotion}
        />
      )}
    </div>
  )
}

export default GameView