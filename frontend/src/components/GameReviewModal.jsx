import { Trophy, Skull, BookOpen, Target, AlertTriangle, X, Loader2, Sparkles } from 'lucide-react'

const RESULT_ICONS = {
  'Vitória': Trophy,
  'Derrota': Skull,
}

const RESULT_COLORS = {
  'Vitória': 'text-emerald-400',
  'Derrota': 'text-rose-400',
}

function GameReviewModal({ review, loading, onClose }) {
  if (!review && !loading) return null

  const ResultIcon = RESULT_ICONS[review?.result] || Target

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Resumo da Partida
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-sm text-slate-400">Analisando a partida...</p>
          </div>
        ) : review ? (
          <div className="space-y-5">
            {/* Resultado */}
            <div className="text-center py-4 bg-slate-800/40 rounded-2xl border border-white/5">
              <ResultIcon className={`w-10 h-10 mx-auto mb-2 ${RESULT_COLORS[review.result] || 'text-slate-400'}`} />
              <p className={`text-xl font-bold ${RESULT_COLORS[review.result] || 'text-slate-300'}`}>
                {review.result}
              </p>
              {review.opening?.name && (
                <p className="text-xs text-slate-500 mt-1">
                  {review.opening.name} {review.opening.code && `(${review.opening.code})`}
                </p>
              )}
            </div>

            {/* Estatísticas */}
            {review.stats && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-2xl font-bold text-white">{review.stats.total_moves}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Lances totais</p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-2xl font-bold text-emerald-400">{review.stats.captures_by_player}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Suas capturas</p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-2xl font-bold text-rose-400">{review.stats.grave_mistakes}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Erros graves</p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-2xl font-bold text-amber-400">{review.stats.moderate_mistakes}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Erros moderados</p>
                </div>
              </div>
            )}

            {/* Erros */}
            {review.mistakes?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase">Principais erros</span>
                </div>
                <div className="space-y-1.5">
                  {review.mistakes.slice(0, 5).map((m, i) => (
                    <div key={i} className={`text-xs p-2.5 rounded-lg border ${
                      m.severity === 'grave' 
                        ? 'bg-rose-500/5 border-rose-500/10 text-rose-300' 
                        : 'bg-amber-500/5 border-amber-500/10 text-amber-300'
                    }`}>
                      <span className="font-medium">Lance {m.move_number}:</span> {m.move_san} → melhor: {m.best_move} 
                      <span className="text-slate-500"> (-{m.cp_loss/100} peões)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo da IA */}
            {review.summary && (
              <div className="bg-violet-500/5 rounded-2xl p-4 border border-violet-500/10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{review.summary}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default GameReviewModal