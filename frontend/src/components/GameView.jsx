import { useMemo, useState } from 'react'
import ChessBoard from './ChessBoard'
import MoveHistoryPanel from './MoveHistoryPanel'
import PromotionModal from './PromotionModal'
import SecondaryButton from './SecondaryButton'
import TurnBadge from './TurnBadge'
import { RotateCcw, Undo2, RefreshCw } from 'lucide-react'

function GameView({ game, boardWidth = 520, bestMoveUci }) {
  const [orientation, setOrientation] = useState('white')

  const autoShapes = useMemo(() => (
    bestMoveUci && bestMoveUci.length >= 4
      ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
      : []
  ), [bestMoveUci])

  function handleAfterMove(orig, dest) {
    game.attemptMove(orig, dest)
  }

  function handleFlip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  const moveLabel = game.moveCount > 0 ? `Lance ${game.moveCount}` : 'Início da partida'

  return (
    <div className="flex flex-col items-center gap-3">
      <TurnBadge turn={game.turn} moveLabel={moveLabel} gameOver={game.isGameOver} />

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

      <div className="flex gap-2">
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