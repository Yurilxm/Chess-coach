import { useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertTriangle, ThumbsUp, ShieldAlert } from 'lucide-react'
import EvalBar from './EvalBar'
import { describeUciMove, explainMoveHeuristic, getOptionInsight } from '../utils/moveTranslation'

const OPTION_LABELS = ['Melhor lance', 'Segunda opção', 'Terceira opção']

function AnalysisPanel({ fen, analysis, loading, error }) {
  const [selected, setSelected] = useState(0)

  // Sempre que chega uma nova análise, volta a destacar a melhor opção
  useEffect(() => {
    setSelected(0)
  }, [analysis])

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

  const options = analysis.top_moves?.length > 0
    ? analysis.top_moves.slice(0, 3)
    : (analysis.best_move ? [analysis.best_move] : [])

  const selectedMove = options[selected]
  const selectedInfo = describeUciMove(fen, selectedMove)
  const reason = selectedInfo ? explainMoveHeuristic(selectedInfo) : ''
  const insight = getOptionInsight(selected)

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Coach Stockfish
        </div>

        <EvalBar evaluation={analysis.evaluation} orientation="horizontal" />

        {options.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Escolha uma opção para entender o lance</p>
            <div className="flex flex-col gap-2">
              {options.map((move, i) => {
                const info = describeUciMove(fen, move)
                const isSelected = i === selected
                return (
                  <button
                    key={move + i}
                    onClick={() => setSelected(i)}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30 ring-1 ring-emerald-500/20'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/[0.08] hover:text-slate-200'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                      {OPTION_LABELS[i] || `Opção ${i + 1}`}
                    </span>
                    {info ? info.text : move}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Antes, esse card inteiro dependia de "selectedInfo" e desaparecia
            por completo quando a tradução do lance falhava. Agora ele
            depende só de existir um lance selecionado — com um texto de
            fallback honesto quando não conseguimos traduzir. */}
        {selectedMove && (
          <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              {reason ? (
                <>
                  <span className="text-emerald-400 font-medium">Motivo: </span>
                  {reason}
                </>
              ) : (
                <>
                  <span className="text-slate-500">Lance: </span>
                  <span className="font-mono text-slate-400">{selectedMove}</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Não foi possível gerar a explicação textual para este lance específico.
                  </span>
                </>
              )}
            </p>
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
              <div className="flex items-start gap-2">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-slate-300 font-medium">Vantagem: </span>
                  {insight.advantage}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-slate-300 font-medium">Risco: </span>
                  {insight.risk}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalysisPanel