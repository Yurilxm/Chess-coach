import { useState, useMemo, useEffect } from 'react'
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

const FILTER_CATEGORIES = ['brilliant', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder']

// Mapeia chave de categoria -> chave da stats do backend
const STATS_KEY = {
  brilliant: 'brilliant',
  best: 'best_moves',
  excellent: 'excellent',
  good: 'good',
  inaccuracy: 'inaccuracies',
  mistake: 'mistakes',
  blunder: 'blunders',
}

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
    return { text, from, to, piece: move.piece, san: move.san, captured: move.captured }
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


function GameReviewModal({
  review, loading, onClose, onReplayMove, replayFen, replayIndex,
  coachExplanation, coachLoading, onExplainMove,
}) {
  const [selectedError, setSelectedError] = useState(null)
  const [filterCategory, setFilterCategory] = useState(null)
  const [explainingMoveNumber, setExplainingMoveNumber] = useState(null)

  // Fecha com Esc.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Ao abrir um review (novo ou do historico), reseta filtro e selecao.
  // Sem isso, o estado da sessao anterior fica pendurado no componente.
  useEffect(() => {
    setFilterCategory(null)
    setSelectedError(null)
    setExplainingMoveNumber(null)
  }, [review])

  // Detecta abertura localmente. Backend nao envia mais 'opening'.
  const opening = useMemo(() => {
    const hist = (review?.all_moves || [])
      .filter(m => m?.move_uci)
      .map(m => ({ from: m.move_uci.slice(0, 2), to: m.move_uci.slice(2, 4) }))
    return detectOpening(hist)
  }, [review])

  const allMoves = useMemo(() => review?.all_moves || [], [review])

  // Lista filtrada de lances para revisar.
  const filteredMoves = useMemo(() => {
    if (!allMoves.length) return []
    const mine = allMoves.filter(m => m.is_player_move)
    if (!filterCategory) {
      return mine.filter(m => ['inaccuracy', 'mistake', 'blunder'].includes(m.category))
    }
    return mine.filter(m => m.category === filterCategory)
  }, [allMoves, filterCategory])

  if (!review && !loading) return null

  const ResultIcon = RESULT_ICONS[review?.result] || Target
  const resultColor = RESULT_COLORS[review?.result] || 'text-slate-300'
  const accuracy = review?.stats?.accuracy || 0
  const accuracyColor = accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-rose-400'

  const currentIndex = replayIndex ?? (allMoves.length > 0 ? allMoves.length - 1 : 0)
  const currentMove = allMoves[currentIndex]

  function handleReplayClick(targetIndex) {
    if (!onReplayMove) return
    if (targetIndex < 0 || targetIndex >= allMoves.length) return
    onReplayMove(targetIndex)
  }

  function getFenForMove(moveIndex) {
    if (moveIndex < 0) return null
    try {
      const temp = new Chess()
      for (let i = 0; i <= moveIndex; i++) {
        const m = allMoves[i]
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

  function handleErrorClick(index) {
    const isOpening = selectedError !== index
    setSelectedError(isOpening ? index : null)
    const mistake = filteredMoves[index]
    if (!mistake) return
    if (onReplayMove) {
      onReplayMove(mistake.move_number - 1)
    }
    if (isOpening && onExplainMove) {
      const fen = getFenForMove(mistake.move_number - 2)
      if (fen) {
        setExplainingMoveNumber(mistake.move_number)
        onExplainMove(
          fen,
          mistake.move_uci,
          { type: 'cp', value: -(mistake.cp_loss || 100) },
        )
      }
    } else {
      setExplainingMoveNumber(null)
    }
  }

  function handleFilterClick(category) {
    setFilterCategory(filterCategory === category ? null : category)
    setSelectedError(null)
    setExplainingMoveNumber(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
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

            {allMoves.length > 0 && (
              <div className="flex items-center justify-center gap-2 bg-slate-800/40 rounded-xl p-2 border border-white/5">
                <button
                  onClick={() => handleReplayClick(0)}
                  disabled={currentIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReplayClick(currentIndex - 1)}
                  disabled={currentIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 min-w-[80px] text-center">
                  Lance {currentIndex + 1}/{allMoves.length}
                </span>
                <button
                  onClick={() => handleReplayClick(currentIndex + 1)}
                  disabled={currentIndex >= allMoves.length - 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReplayClick(allMoves.length - 1)}
                  disabled={currentIndex >= allMoves.length - 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            )}

            {replayFen && (
              <div className="flex flex-col items-center gap-2 py-1">
                {currentMove && CATEGORY_ICONS[currentMove.category] && (() => {
                  const cat = CATEGORY_ICONS[currentMove.category]
                  const CatIcon = cat.icon
                  return (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${cat.bg} ${cat.border}`}>
                      <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                      <span className={`text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                      {currentMove.color && (
                        <span className="text-[10px] text-slate-500">
                          · {currentMove.color === 'w' ? 'Brancas' : 'Pretas'}
                        </span>
                      )}
                    </div>
                  )
                })()}
                <ChessBoard
                  fen={replayFen}
                  boardWidth={280}
                  showDests={false}
                  freeMove={false}
                  dests={new Map()}
                  autoShapes={currentMove?.move_uci?.length >= 4
                    ? [{
                        orig: currentMove.move_uci.slice(0, 2),
                        dest: currentMove.move_uci.slice(2, 4),
                        brush: 'green',
                      }]
                    : []}
                />
              </div>
            )}

            {review.stats && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">
                  Clique para filtrar os lances
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {FILTER_CATEGORIES.map((catKey) => {
                    const cat = CATEGORY_ICONS[catKey]
                    const CatIcon = cat.icon
                    const count = review.stats[STATS_KEY[catKey]] || 0
                    const isActive = filterCategory === catKey
                    return (
                      <button
                        key={catKey}
                        onClick={() => handleFilterClick(catKey)}
                        disabled={count === 0}
                        className={`rounded-xl p-2 text-center border transition-all ${
                          isActive ? 'ring-2 ring-white/40 scale-[1.03]' : ''
                        } ${cat.bg} ${cat.border} disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                        title={count > 0 ? `Filtrar ${cat.label}` : 'Nenhum lance'}
                      >
                        <CatIcon className={`w-4 h-4 mx-auto mb-0.5 ${cat.color}`} />
                        <p className={`text-lg font-bold ${cat.color}`}>{count}</p>
                        <p className="text-[9px] text-slate-500">{cat.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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

            {filteredMoves.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crosshair className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    {filterCategory
                      ? `${CATEGORY_ICONS[filterCategory]?.label} (${filteredMoves.length})`
                      : `Lances para revisar (${filteredMoves.length})`}
                  </span>
                  {filterCategory && (
                    <button
                      onClick={() => setFilterCategory(null)}
                      className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 underline"
                    >
                      limpar filtro
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {filteredMoves.map((m, i) => {
                    const cat = CATEGORY_ICONS[m.category] || CATEGORY_ICONS['inaccuracy']
                    const CatIcon = cat.icon
                    const isExpanded = selectedError === i
                    const isExplainingThis = explainingMoveNumber === m.move_number

                    const currentFenForMove = getFenForMove(m.move_number - 2)
                    const moveDesc = currentFenForMove ? getMoveDescription(currentFenForMove, m.move_uci) : null
                    const bestDesc = currentFenForMove ? getMoveDescription(currentFenForMove, m.best_move) : null

                    return (
                      <div key={`${m.move_number}-${m.category}`}>
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
                          <span className="text-slate-500 ml-1">(-{(m.cp_loss / 100).toFixed(1)} peões)</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5 ml-2 p-3 bg-slate-800/60 rounded-lg border border-white/5 space-y-2">
                            {isExplainingThis && coachLoading && (
                              <div className="flex items-center gap-2 py-1">
                                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                                <span className="text-xs text-slate-400">Coach analisando o lance...</span>
                              </div>
                            )}
                            {isExplainingThis && !coachLoading && coachExplanation && (
                              <div className="bg-violet-500/5 rounded-lg p-2 border border-violet-500/10">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-slate-300 leading-relaxed">{coachExplanation}</p>
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {getErrorExplanation(m.category, m.cp_loss || 100, moveDesc, bestDesc)}
                            </p>
                            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
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

            {filteredMoves.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">
                {filterCategory
                  ? 'Nenhum lance nesta categoria.'
                  : 'Nenhum erro para revisar. Jogo limpo!'}
              </div>
            )}

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
