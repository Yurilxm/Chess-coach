import { useMemo } from 'react'
import ChessBoard from './ChessBoard'
import { RefreshCw, Eraser, ArrowLeftRight } from 'lucide-react'

function EditorView({ editor, boardWidth = 520, bestMoveUci }) {
  const autoShapes = useMemo(() => (
    bestMoveUci && bestMoveUci.length >= 4
      ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
      : []
  ), [bestMoveUci])

  function handleAfterMove(orig, dest) {
    editor.movePiece(orig, dest)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ChessBoard
        fen={editor.fen}
        boardWidth={boardWidth}
        movableColor="both"
        freeMove
        dests={undefined}
        showDests={false}
        autoShapes={autoShapes}
        onAfterMove={handleAfterMove}
      />

      <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-medium">
        Modo Editor — arraste as peças livremente
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => editor.reset()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/10 hover:shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Posição inicial
        </button>
        <button
          onClick={() => editor.clear()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/10 hover:shadow-md"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpar tabuleiro
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>Vez de jogar:</span>
        <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-white/5">
          <button
            onClick={() => editor.setSideToMove('w')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              editor.turn === 'w' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Brancas
          </button>
          <button
            onClick={() => editor.setSideToMove('b')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              editor.turn === 'b' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
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