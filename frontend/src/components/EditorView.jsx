import { useState } from 'react'
import ChessBoard from './ChessBoard'
import SecondaryButton from './SecondaryButton'
import TurnBadge from './TurnBadge'
import { RefreshCw, Undo2, RotateCcw, ArrowLeftRight } from 'lucide-react'

function EditorView({ editor, boardWidth = 520, bestMoveUci }) {
  const [orientation, setOrientation] = useState('white')

  const autoShapes = bestMoveUci && bestMoveUci.length >= 4
    ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
    : []

  function handleAfterMove(orig, dest) {
    editor.movePiece(orig, dest)
  }

  function handleFlip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <TurnBadge turn={editor.turn} moveLabel="Modo Editor" />

      <ChessBoard
        fen={editor.fen}
        orientation={orientation}
        boardWidth={boardWidth}
        movableColor="both"
        freeMove={true}
        dests={undefined}
        showDests={false}
        autoShapes={autoShapes}
        onAfterMove={handleAfterMove}
      />

      <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-medium">
        Modo Editor — arraste as peças livremente
      </span>

      <div className="flex gap-2">
        <SecondaryButton icon={RefreshCw} onClick={() => editor.reset()}>
          Posição inicial
        </SecondaryButton>
        <SecondaryButton icon={Undo2} onClick={() => editor.undo()} disabled={!editor.canUndo}>
          Desfazer
        </SecondaryButton>
        <SecondaryButton icon={RotateCcw} onClick={handleFlip}>
          Girar tabuleiro
        </SecondaryButton>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>Vez de jogar:</span>
        <div className="flex bg-slate-900/60 backdrop-blur-sm rounded-xl p-1 ring-1 ring-white/10">
          <button
            onClick={() => editor.setSideToMove('w')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              editor.turn === 'w'
                ? 'bg-gradient-to-b from-white to-slate-100 text-slate-900 shadow-md shadow-black/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Brancas
          </button>
          <button
            onClick={() => editor.setSideToMove('b')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              editor.turn === 'b'
                ? 'bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-md shadow-black/30 ring-1 ring-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pretas
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorView