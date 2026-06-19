import { Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import EvalBar from './EvalBar'
import { describeUciMove, explainMoveHeuristic } from '../utils/moveTranslation'

function AnalysisPanel({ fen, analysis, loading, error }) {
  if (loading) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Analisando a posição...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 backdrop-blur-sm rounded-2xl border border-rose-500/20 p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-rose-300">{error}</p>
      </div>
    )
  }

  if (!analysis) return null

  const bestMoveInfo = describeUciMove(fen, analysis.best_move)
  const reason = bestMoveInfo ? explainMoveHeuristic(bestMoveInfo) : ''

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Coach Stockfish
        </div>

        <EvalBar evaluation={analysis.evaluation} orientation="horizontal" />

        <div className="bg-slate-800/60 rounded-xl p-4 space-y-2">
          <p className="text-xs text-slate-500">Melhor lance</p>
          <p className="text-xl font-bold text-white">
            {bestMoveInfo ? bestMoveInfo.text : analysis.best_move}
          </p>
          {reason && (
            <p className="text-sm text-slate-400 leading-relaxed pt-2 mt-1 border-t border-white/5">
              <span className="text-emerald-400 font-medium">Motivo: </span>
              {reason}
            </p>
          )}
        </div>

        {analysis.top_moves?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Outras boas continuações</p>
            <div className="flex flex-col gap-2">
              {analysis.top_moves.map((move, i) => {
                const info = describeUciMove(fen, move)
                return (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      i === 0
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-white/5 text-slate-400 border-white/5'
                    }`}
                  >
                    {info ? info.text : move}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalysisPanel