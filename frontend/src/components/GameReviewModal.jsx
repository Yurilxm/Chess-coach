import { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import ChessBoard from './ChessBoard'
import { detectOpening } from '../utils/openings'
import {
  Trophy, Skull, Handshake, Target, X, Loader2, Sparkles, Brain,
  Crosshair, Zap, ThumbsUp, AlertTriangle, Flame, Diamond,
  ChevronLeft, ChevronRight, SkipBack, SkipForward, Play
} from 'lucide-react'

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

const PIECE_NAMES = { p: 'Peão', n: 'Cavalo', b: 'Bispo', r: 'Torre', q: 'Dama', k: 'Rei' }

function getMoveDescription(fen, uci) {
  try {
    const from = uci.substring(0, 2)
    const to = uci.substring(2, 4)
    const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined
    const temp = new Chess(fen)
    const move = promotion ? temp.move({ from, to, promotion }) : temp.move({ from, to })
    if (!move) return null
    const piece = PIECE_NAMES[move.piece] || 'Peça'
    let text = `${piece} de ${from} para ${to}`
    if (move.captured) text += `, capturando ${(PIECE_NAMES[move.captured] || 'peça').toLowerCase()}`
    return { text, from, to, piece: move.piece, san: move.san }
  } catch { return null }
}

function getErrorExplanation(category, cpLoss, moveDesc, bestDesc) {
  const lossPeoes = (cpLoss / 100).toFixed(1)
  const base = {
    'blunder': `Você perdeu ${lossPeoes} peões de vantagem com este lance.`,
    'mistake': `Este lance custou ${lossPeoes} peões de vantagem.`,
    'inaccuracy': `Uma pequena imprecisão que cedeu ${lossPeoes} peões.`,
  }
  const detail = []
  if (cpLoss > 200) detail.push('Foi um erro grave que mudou drasticamente a avaliação da posição.')
  else if (cpLoss > 100) detail.push('Este lance permitiu que o adversário ganhasse vantagem.')
  if (moveDesc?.captured && !bestDesc?.captured) detail.push('Você capturou uma peça, mas existia um lance melhor.')
  if (!moveDesc?.captured && bestDesc?.captured) detail.push('Você perdeu uma oportunidade de capturar uma peça adversária.')
  
  return (base[category] || base['inaccuracy']) + ' ' + detail.join(' ')
}

function GameReviewModal({ review, loading, onClose, onReplayMove, replayFen, replayIndex }) {
  const [selectedError, setSelectedError] = useState(null)

  // Detecta abertura localmente. Backend nao envia mais 'opening'.
  const opening = useMemo(() => {
    const hist = (review?.all_moves || [])
      .filter(m => m?.move_uci)
      .map(m => ({ from: m.move_uci.slice(0, 2), to: m.move_uci.slice(2, 4) }))
    return detectOpening(hist)
  }, [review])

  if (!review && !loading) return null

  const ResultIcon = RESULT_ICONS[review?.result] || Target
  const resultColor = RESULT_COLORS[review?.result] || 'text-slate-300'
  const accuracy = review?.stats?.accuracy || 0
  const accuracyColor = accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-rose-400'

  const allMoves = review?.all_moves || []
  const mistakes = review?.mistakes || []

  // Encontra a análise do lance selecionado
  const selectedAnalysis = selectedError !== null ? mistakes[selectedError] : null
  const selectedMoveData = selectedAnalysis ? allMoves.find(m => m.move_number === selectedAnalysis.move_number) : null

  function handleErrorClick(index) {
    setSelectedError(selectedError === index ? null : index)
    const mistake = mistakes[index]
    if (mistake && onReplayMove) {
      onReplayMove(mistake.move_number - 1)
    }
  }

  function getFenForMove(moveIndex) {
    if (moveIndex < 0) return null
    try {
      const temp = new Chess()
      for (let i = 0; i <= moveIndex; i++) {
        const m = review.all_moves?.[i]
        if (m?.move_uci) {
          const uci = m.move_uci
          const from = uci.substring(0, 2)
          const to = uci.substring(2, 4)
          const promo = uci.length > 4 ? uci.substring(4, 5) : undefined
          promo ? temp.move({ from, to, promotion: promo }) : temp.move({ from, to })
        }
      }
      return temp.fen()
    } catch { return null }
  }

  const currentFen = replayFen || (review?.all_moves?.length > 0 ? getFenForMove(review.all_moves.length - 1) : null)

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
              <p className={`text-2xl font-bold ${resultColor}`}>{review.result}</p>
              {review.result_reason && (
                <p className="text-xs text-slate-500 mt-1">{review.result_reason}</p>
              )}
              {opening?.name && (
                <p className="text-xs text-cyan-400/80 mt-1">
                  📖 {opening.name} {opening.code && `(${opening.code})`}
                </p>
              )}
              {accuracy > 0 && (
                <div className="mt-3">
                  <span className={`text-3xl font-bold ${accuracyColor}`}>{accuracy}%</span>
                  <p className="text-[10px] text-slate-500 uppercase">Precisão</p>
                </div>
              )}
            </div>

            {/* Controles de replay */}
            {allMoves.length > 0 && (
              <div className="flex items-center justify-center gap-2 bg-slate-800/40 rounded-xl p-2 border border-white/5">
                <button onClick={() => onReplayMove?.(0)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title="Início">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => onReplayMove?.((replayIndex ?? allMoves.length - 1) - 1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title="Anterior">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 min-w-[60px] text-center">
                  Lance {(replayIndex ?? allMoves.length - 1) + 1}/{allMoves.length}
                </span>
                <button onClick={() => onReplayMove?.((replayIndex ?? allMoves.length - 1) + 1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title="Próximo">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => onReplayMove?.(allMoves.length - 1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white" title="Final">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tabuleiro de replay */}
            {replayFen && (
              <div className="flex justify-center py-1">
                <ChessBoard
                  fen={replayFen}
                  boardWidth={280}
                  showDests={false}
                  freeMove={false}
                  dests={new Map()}
                />
              </div>
            )}

            {/* Classificação dos lances */}
            {review.stats && (
              <div className="grid grid-cols-4 gap-1.5">
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

            {/* Lista de erros clicáveis com explicações */}
            {mistakes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crosshair className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase">Lances para revisar</span>
                </div>
                <div className="space-y-2">
                  {mistakes.slice(0, 8).map((m, i) => {
                    const cat = CATEGORY_ICONS[m.category] || CATEGORY_ICONS['inaccuracy']
                    const CatIcon = cat.icon
                    const isExpanded = selectedError === i

                    // Descrição do lance
                    const currentFenForMove = getFenForMove(m.move_number - 2)
                    const moveDesc = currentFenForMove ? getMoveDescription(currentFenForMove, m.move_uci) : null
                    const bestDesc = currentFenForMove ? getMoveDescription(currentFenForMove, m.best_move) : null

                    return (
                      <div key={i}>
                        <button
                          onClick={() => handleErrorClick(i)}
                          className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${cat.bg} ${cat.border} hover:scale-[1.02]`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <CatIcon className={`w-3 h-3 ${cat.color}`} />
                            <span className={`font-semibold ${cat.color}`}>{cat.label}</span>
                            <span className="text-slate-500">• Lance {m.move_number}</span>
                            {isExpanded && <Play className="w-3 h-3 text-violet-400 ml-auto" />}
                          </div>
                          <span className="text-slate-300">
                            {moveDesc ? moveDesc.text : m.move_san} → <span className="text-emerald-400/80">{bestDesc ? bestDesc.text : m.best_move}</span>
                          </span>
                          <span className="text-slate-500 ml-1">(-{m.cp_loss/100} peões)</span>
                        </button>
                        
                        {/* Explicação expandida */}
                        {isExpanded && (
                          <div className="mt-1.5 ml-2 p-3 bg-slate-800/60 rounded-lg border border-white/5">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {getErrorExplanation(m.category, m.cp_loss || 100, moveDesc, bestDesc)}
                            </p>
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                              <div className="flex-1">
                                <p className="text-[10px] text-rose-400/80 font-medium">Seu lance</p>
                                <p className="text-xs text-slate-300">{moveDesc ? moveDesc.text : m.move_san}</p>
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] text-emerald-400/80 font-medium">Melhor lance</p>
                                <p className="text-xs text-slate-300">{bestDesc ? bestDesc.text : m.best_move}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Resumo */}
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