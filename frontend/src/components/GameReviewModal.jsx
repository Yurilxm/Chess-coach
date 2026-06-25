import { Trophy, Skull, Handshake, Target, X, Loader2, Sparkles, Brain, Crosshair, Zap, ThumbsUp, AlertTriangle, Flame, Diamond } from 'lucide-react'

const RESULT_ICONS = {
  'Vitória': Trophy,
  'Derrota': Skull,
  'Empate': Handshake,
}

const RESULT_COLORS = {
  'Vitória': 'text-emerald-400',
  'Derrota': 'text-rose-400',
  'Empate': 'text-amber-400',
}

const CATEGORY_ICONS = {
  'brilliant':   { icon: Diamond, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Brilhante' },
  'best':        { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Melhor' },
  'excellent':   { icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Excelente' },
  'good':        { icon: ThumbsUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Bom' },
  'inaccuracy':  { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Imprecisão' },
  'mistake':     { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Erro' },
  'blunder':     { icon: Skull, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Blunder' },
}

function GameReviewModal({ review, loading, onClose }) {
  if (!review && !loading) return null

  const ResultIcon = RESULT_ICONS[review?.result] || Target
  const resultColor = RESULT_COLORS[review?.result] || 'text-slate-300'
  const accuracy = review?.stats?.accuracy || 0
  const accuracyColor = accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Análise da Partida
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
          <div className="space-y-4">
            
            {/* Resultado + Precisão */}
            <div className="text-center py-5 bg-slate-800/40 rounded-2xl border border-white/5">
              <ResultIcon className={`w-12 h-12 mx-auto mb-2 ${resultColor}`} />
              <p className={`text-2xl font-bold ${resultColor}`}>
                {review.result}
              </p>
              {review.result_reason && (
                <p className="text-xs text-slate-500 mt-1">
                  {review.result_reason}
                </p>
              )}
              {review.opening?.name && (
                <p className="text-xs text-cyan-400/80 mt-1">
                  📖 {review.opening.name} {review.opening.code && `(${review.opening.code})`}
                </p>
              )}
              {accuracy > 0 && (
                <div className="mt-3">
                  <span className={`text-3xl font-bold ${accuracyColor}`}>{accuracy}%</span>
                  <p className="text-[10px] text-slate-500 uppercase">Precisão</p>
                </div>
              )}
            </div>

            {/* Classificação dos lances (estilo chess.com) */}
            {review.stats && (
              <div className="grid grid-cols-4 gap-1.5">
                {review.stats.brilliant > 0 && (
                  <div className="bg-cyan-500/10 rounded-xl p-2 text-center border border-cyan-500/20">
                    <Diamond className="w-4 h-4 text-cyan-400 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-cyan-400">{review.stats.brilliant}</p>
                    <p className="text-[9px] text-slate-500">Brilhante</p>
                  </div>
                )}
                {review.stats.best_moves > 0 && (
                  <div className="bg-emerald-500/10 rounded-xl p-2 text-center border border-emerald-500/20">
                    <Sparkles className="w-4 h-4 text-emerald-400 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-emerald-400">{review.stats.best_moves}</p>
                    <p className="text-[9px] text-slate-500">Melhor</p>
                  </div>
                )}
                <div className="bg-green-500/10 rounded-xl p-2 text-center border border-green-500/20">
                  <Zap className="w-4 h-4 text-green-400 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-green-400">{review.stats.excellent || 0}</p>
                  <p className="text-[9px] text-slate-500">Excelente</p>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-2 text-center border border-blue-500/20">
                  <ThumbsUp className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-blue-400">{review.stats.good || 0}</p>
                  <p className="text-[9px] text-slate-500">Bom</p>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-2 text-center border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-amber-400">{review.stats.inaccuracies || 0}</p>
                  <p className="text-[9px] text-slate-500">Imprecisão</p>
                </div>
                <div className="bg-orange-500/10 rounded-xl p-2 text-center border border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-400 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-orange-400">{review.stats.mistakes || 0}</p>
                  <p className="text-[9px] text-slate-500">Erro</p>
                </div>
                <div className="bg-rose-500/10 rounded-xl p-2 text-center border border-rose-500/20">
                  <Skull className="w-4 h-4 text-rose-400 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-rose-400">{review.stats.blunders || 0}</p>
                  <p className="text-[9px] text-slate-500">Blunder</p>
                </div>
              </div>
            )}

            {/* Estatísticas rápidas */}
            {review.stats && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-xl font-bold text-white">{review.stats.total_moves}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Lances totais</p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-xl font-bold text-emerald-400">{review.stats.captures_by_player}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Suas capturas</p>
                </div>
              </div>
            )}

            {/* Lista de erros com categoria */}
            {review.mistakes?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crosshair className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase">Lances para revisar</span>
                </div>
                <div className="space-y-1.5">
                  {review.mistakes.slice(0, 8).map((m, i) => {
                    const cat = CATEGORY_ICONS[m.category] || CATEGORY_ICONS['inaccuracy']
                    const CatIcon = cat.icon
                    return (
                      <div key={i} className={`text-xs p-2.5 rounded-lg border ${cat.bg} ${cat.border}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CatIcon className={`w-3 h-3 ${cat.color}`} />
                          <span className={`font-semibold ${cat.color}`}>{cat.label}</span>
                          <span className="text-slate-500">• Lance {m.move_number}</span>
                        </div>
                        <span className="text-slate-300">
                          {m.move_san} → <span className="text-emerald-400/80">{m.best_move}</span>
                        </span>
                        <span className="text-slate-500 ml-1">(-{m.cp_loss/100} peões)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Resumo da IA ou Local */}
            {review.summary && (
              <div className="bg-violet-500/5 rounded-2xl p-4 border border-violet-500/10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{review.summary}</p>
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