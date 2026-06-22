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
import { RotateCcw, Undo2, RefreshCw } from 'lucide-react'

function GameView({ game, boardWidth = 520, bestMoveUci }) {
  const [orientation, setOrientation] = useState('white')

  const autoShapes = useMemo(() => (
    bestMoveUci && bestMoveUci.length >= 4
      ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
      : []
  ), [bestMoveUci])

  const captured = useMemo(() => getCapturedPieces(game.history), [game.history])
  
  // Detecta a abertura baseada no histórico
  const opening = useMemo(() => detectOpening(game.history), [game.history])

  function handleAfterMove(orig, dest) {
    game.attemptMove(orig, dest)
  }

  function handleFlip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  const moveLabel = game.moveCount > 0 ? `Lance ${game.moveCount}` : 'Início da partida'

  // Peças capturadas: byWhite = pretas comidas pelas brancas, byBlack = brancas comidas pelas pretas
  const whiteCaptured = captured.byWhite
  const blackCaptured = captured.byBlack

  // Verifica se tem peças capturadas para adicionar margem extra
  const hasCapturedPieces = whiteCaptured.length > 0 || blackCaptured.length > 0

  return (
    <div className="flex flex-col items-center gap-3">
      <TurnBadge turn={game.turn} moveLabel={moveLabel} gameOver={game.isGameOver} gameOverReason={game.gameOverReason} />
      
      {/* Exibe a abertura detectada */}
      <OpeningBadge opening={opening} />

      {/* Container do tabuleiro + peças capturadas nos cantos */}
      <div className="relative" style={{ width: boardWidth, paddingBottom: hasCapturedPieces ? '8px' : '0' }}>
        {/* Peças comidas pelas PRETAS - canto superior direito */}
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
          movableColor={game.isGameOver ? undefined : (game.turn === 'w' ? 'white' : 'black')}
          freeMove={false}
          dests={game.isGameOver ? new Map() : game.getDests()}
          autoShapes={autoShapes}
          onAfterMove={handleAfterMove}
        />

        {/* Peças comidas pelas BRANCAS - canto inferior esquerdo */}
        <div className="absolute -bottom-6 left-0">
          <CapturedPieces pieces={whiteCaptured} color="b" />
        </div>
      </div>

      {/* Botões com margem extra quando tem peças capturadas */}
      <div className={`flex gap-2 ${hasCapturedPieces ? 'mt-4' : ''}`}>
        <SecondaryButton icon={RefreshCw} onClick={() => game.reset()}>
          Nova partida
        </SecondaryButton>
        <SecondaryButton icon={Undo2} onClick={() => game.undo()} disabled={game.history.length === 0}>
          Desfazer
        </SecondaryButton>
        <SecondaryButton icon={RotateCcw} onClick={handleFlip}>
          Girar tabuleiro
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