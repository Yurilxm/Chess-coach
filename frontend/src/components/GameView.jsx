import { useMemo, useState } from 'react'
import ChessBoard from './ChessBoard'
import MoveHistoryPanel from './MoveHistoryPanel'
import PromotionModal from './PromotionModal'
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

  return (
    <div className="flex flex-col items-center gap-3">
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

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>
          {game.moveCount > 0 ? `Lance ${game.moveCount}` : 'Início da partida'} • Vez das{' '}
          {game.turn === 'w' ? 'brancas' : 'pretas'}
        </span>
        {game.isGameOver && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            Fim de jogo
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => game.reset()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/10 hover:shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Nova partida
        </button>
        <button
          onClick={() => game.undo()}
          disabled={game.history.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/10 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Desfazer
        </button>
        <button
          onClick={handleFlip}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/10 hover:shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Girar tabuleiro
        </button>
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