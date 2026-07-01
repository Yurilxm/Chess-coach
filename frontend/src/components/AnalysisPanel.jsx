import { Sparkles, Loader2, AlertTriangle, ThumbsUp, ShieldAlert } from 'lucide-react'
import EvalBar from './EvalBar'
import { describeUciMove } from '../utils/moveTranslation'

const OPTION_LABELS = ['Melhor lance', 'Segunda opção', 'Terceira opção']

function formatCp(cp) {
  if (cp === 0) return '0.00'
  const sign = cp > 0 ? '+' : ''
  return `${sign}${(cp / 100).toFixed(2)}`
}

function formatMate(mate) {
  const moves = Math.abs(mate)
  if (mate > 0) return `Mate em ${moves}`
  return `Mate em -${moves}`
}

function getEvaluationText(evaluation) {
  if (!evaluation) return 'Avaliação indisponível'
  if (evaluation.type === 'mate') {
    const mateIn = evaluation.value
    if (mateIn > 0) return `Vantagem decisiva — mate em ${mateIn} lances`
    if (mateIn < 0) return `Desvantagem decisiva — sofre mate em ${Math.abs(mateIn)} lances`
    return 'Posição de mate'
  }
  const cp = evaluation.value
  const abs = Math.abs(cp)
  if (abs < 30) return 'Posição equilibrada'
  if (abs < 70) return cp > 0 ? 'Ligeira vantagem das brancas' : 'Ligeira vantagem das pretas'
  if (abs < 150) return cp > 0 ? 'Vantagem clara das brancas' : 'Vantagem clara das pretas'
  return cp > 0 ? 'Vantagem decisiva das brancas' : 'Vantagem decisiva das pretas'
}

function getAdvantageText(evaluation) {
  if (!evaluation) return 'Avaliação indisponível'
  if (evaluation.type === 'mate') {
    const mateIn = evaluation.value
    if (mateIn > 0) return `As brancas têm mate forçado em ${mateIn} lances`
    if (mateIn < 0) return `As pretas têm mate forçado em ${Math.abs(mateIn)} lances`
    return 'Posição de mate'
  }
  const cp = evaluation.value
  if (cp === 0) return 'A posição está completamente equilibrada'
  if (cp > 0) return `As brancas estão melhores (${formatCp(cp)})`
  return `As pretas estão melhores (${formatCp(-cp)})`
}

function getRiskText(lines, selectedIndex) {
  if (!lines || lines.length < 2) return 'Análise de risco indisponível'
  const selected = lines[selectedIndex]
  const best = lines[0]
  if (!selected || !best) return 'Análise de risco indisponível'
  const compareWith = selectedIndex === 0 ? lines[1] : best
  if (!compareWith) return 'Análise de risco indisponível'
  const selectedEval = selected.evaluation
  const compareEval = compareWith.evaluation
  if (selectedEval.type !== compareEval.type) {
    return 'Atenção: esta opção leva a uma situação drasticamente diferente da melhor linha'
  }
  if (selectedEval.type === 'mate') {
    const diff = selectedEval.value - compareEval.value
    if (selectedIndex === 0) {
      return diff <= -3 ? 'Alerta: a segunda opção atrasa significativamente o mate' : 'Há outras linhas que também levam ao mate'
    }
    return diff >= 3 ? 'Esta opção é pior que a melhor linha' : 'Esta opção é próxima da melhor linha'
  }
  const diff = selectedEval.value - compareEval.value
  if (selectedIndex === 0) {
    if (diff < -150) return 'Alerta: a segunda opção é muito inferior. Jogue o melhor lance com precisão!'
    if (diff < -70) return 'A segunda opção é consideravelmente pior. Prefira o melhor lance'
    if (diff < -30) return 'Existem alternativas razoáveis, mas o melhor lance é claramente superior'
    return 'Há várias opções viáveis nesta posição'
  }
  if (diff > 150) return 'Alerta: esta opção é muito inferior à melhor linha'
  if (diff > 70) return 'Esta opção é consideravelmente pior que a melhor'
  if (diff > 30) return 'Esta opção é razoável, mas inferior à melhor'
  return 'Esta opção é quase tão boa quanto a melhor'
}

function AnalysisPanel({ fen, analysis, loading, error, selected = 0, onSelect, coachExplanation, coachLoading }) {
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

  
  const analysisFen = analysis.fen || fen

  const lines = analysis.lines?.length > 0 
    ? analysis.lines 
    : analysis.top_moves?.map(move => ({ move, evaluation: analysis.evaluation })) || []

  const options = lines.slice(0, 3)
  const selectedLine = options[selected]
  const selectedMove = selectedLine?.move
  const selectedEval = selectedLine?.evaluation

  const moveInfo = selectedMove ? describeUciMove(analysisFen, selectedMove) : null
  const evaluationText = selectedEval ? getEvaluationText(selectedEval) : ''
  const advantageText = selectedEval ? getAdvantageText(selectedEval) : ''
  const riskText = getRiskText(lines, selected)

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Coach Stockfish
        </div>

        <EvalBar evaluation={selectedEval || analysis.evaluation} orientation="horizontal" />

        {selectedEval && (
          <div className="text-center">
            <span className={`text-sm font-semibold ${
              selectedEval.type === 'mate' 
                ? 'text-amber-400' 
                : selectedEval.value > 0 
                  ? 'text-white' 
                  : selectedEval.value < 0 
                    ? 'text-slate-400' 
                    : 'text-slate-300'
            }`}>
              {selectedEval.type === 'mate' 
                ? formatMate(selectedEval.value) 
                : formatCp(selectedEval.value)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {evaluationText}
            </span>
          </div>
        )}

        {options.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Escolha uma opção para entender o lance</p>
            <div className="flex flex-col gap-2">
              {options.map((line, i) => {
                const info = describeUciMove(analysisFen, line.move)
                const isSelected = i === selected
                let evalBadge = ''
                if (line.evaluation?.type === 'mate') {
                  evalBadge = `M${line.evaluation.value}`
                } else if (line.evaluation?.type === 'cp') {
                  evalBadge = formatCp(line.evaluation.value)
                }
                return (
                  <button
                    key={line.move + i}
                    onClick={() => onSelect?.(i)}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30 ring-1 ring-emerald-500/20'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/[0.08] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="block text-[10px] uppercase tracking-wider opacity-70">
                        {OPTION_LABELS[i] || `Opção ${i + 1}`}
                      </span>
                      {evalBadge && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'
                        }`}>
                          {evalBadge}
                        </span>
                      )}
                    </div>
                    <span className={isSelected ? 'text-emerald-100' : 'text-slate-300'}>
                      {info ? info.text : line.move}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedMove && (
          <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
            {evaluationText && (
              <p className="text-sm text-slate-300 leading-relaxed pb-2 border-b border-white/5">
                <span className="text-emerald-400 font-medium">Avaliação: </span>
                {evaluationText}
              </p>
            )}

            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="text-slate-500">Lance: </span>
              {moveInfo ? moveInfo.text : (
                <>
                  <span className="font-mono text-slate-400">{selectedMove}</span>
                  <span className="block text-xs text-slate-500 mt-1">Notação UCI do motor</span>
                </>
              )}
            </p>

            {/* Explicação da IA ou Fallback */}
            {coachLoading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-xs text-slate-400">Coach analisando o lance...</span>
              </div>
            ) : coachExplanation ? (
              <div className="bg-violet-500/5 rounded-xl p-3 border border-violet-500/10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {coachExplanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-medium">Vantagem: </span>
                    {advantageText}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-medium">Risco: </span>
                    {riskText}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalysisPanel