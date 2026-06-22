import { useMemo } from 'react'
import ChessBoard from './ChessBoard'
import MoveHistoryPanel from './MoveHistoryPanel'
import PromotionModal from './PromotionModal'
import SecondaryButton from './SecondaryButton'
import TurnBadge from './TurnBadge'
import CapturedPieces from './CapturedPieces'
import OpeningBadge from './OpeningBadge'
import { getCapturedPieces } from '../utils/chessHelpers'
import { detectOpening } from '../utils/openings'
import { RefreshCw } from 'lucide-react'

function GameView({ game, boardWidth = 520, bestMoveUci, isBotMode = false, onBotReset }) {
  // No modo Bot, orientação segue a cor do jogador
  // Pretas = tabuleiro virado (black), Brancas = normal (white)
  const orientation = isBotMode 
    ? (game.playerColor === 'b' ? 'black' : 'white')
    : 'white'

  const autoShapes = useMemo(() => (
    bestMoveUci && bestMoveUci.length >= 4
      ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
      : []
  ), [bestMoveUci])

  const captured = useMemo(() => getCapturedPieces(game.history), [game.history])
  const opening = useMemo(() => detectOpening(game.history), [game.history])

  function handleAfterMove(orig, dest) {
    game.attemptMove(orig, dest)
  }

  const moveLabel = game.moveCount > 0 ? `Lance ${game.moveCount}` : 'Início da partida'
  const whiteCaptured = captured.byWhite
  const blackCaptured = captured.byBlack
  const hasCapturedPieces = whiteCaptured.length > 0 || blackCaptured.length > 0

  // No modo Bot, jogador só mexe suas peças
  // No modo normal, mexe as peças da vez (ou nenhuma se game over)
  const movableColor = isBotMode
    ? (game.playerColor === 'w' ? 'white' : 'black')
    : (game.isGameOver ? undefined : (game.turn === 'w' ? 'white' : 'black'))

  // No modo Bot, só mostra dests quando é a vez do jogador
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

  return (
    <div className="flex flex-col items-center gap-3">
      <TurnBadge 
        turn={game.turn} 
        moveLabel={moveLabel} 
        gameOver={game.isGameOver} 
        gameOverReason={game.gameOverReason} 
      />
      
      <OpeningBadge opening={opening} />

      <div className="relative" style={{ width: boardWidth, paddingBottom: hasCapturedPieces ? '8px' : '0' }}>
        <div className="absolute -top-6 right-0">
          <CapturedPieces pieces={blackCaptured} color="w" />
        </div>

        <ChessBoard
          fen={game.fen}
          orientation={orientation}
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

      <div className={`flex gap-2 ${hasCapturedPieces ? 'mt-4' : ''}`}>
        <SecondaryButton icon={RefreshCw} onClick={handleReset}>
          {isBotMode ? 'Novo jogo' : 'Nova partida'}
        </SecondaryButton>
      </div>

      <MoveHistoryPanel history={game.history} />

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