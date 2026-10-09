import { useState, useMemo, useEffect } from 'react'
import { Trophy, Skull, Handshake, Trash2, Calendar, Target, ChevronRight, AlertCircle } from 'lucide-react'

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

const RESULT_BG = {
  'Vitória': 'bg-emerald-500/10 border-emerald-500/20',
  'Derrota': 'bg-rose-500/10 border-rose-500/20',
  'Empate': 'bg-amber-500/10 border-amber-500/20',
}


function formatDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const ano = d.getFullYear()
    const hora = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${ano} ${hora}:${min}`
  } catch {
    return iso
  }
}


function ConfirmDeleteModal({ onCancel, onConfirm }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl p-5 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold leading-tight">Apagar esta partida?</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              A partida será removida do histórico. Essa ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>
  )
}


function MatchHistoryView({ matches, onOpenMatch, onDeleteMatch, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [deletingMatch, setDeletingMatch] = useState(null)

  const lista = useMemo(() => matches || [], [matches])

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    onClearAll()
    setConfirmClear(false)
  }

  function handleConfirmDelete() {
    if (deletingMatch) {
      onDeleteMatch(deletingMatch.id)
      setDeletingMatch(null)
    }
  }

  if (lista.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
          <Calendar className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-300 font-medium mb-1">Nenhuma partida registrada</p>
        <p className="text-slate-500 text-sm max-w-[280px] mx-auto">
          Jogue contra o Bot para que suas partidas apareçam aqui com estatísticas completas.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-white">Histórico de Partidas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lista.length} {lista.length === 1 ? 'partida salva' : 'partidas salvas'}
            </p>
          </div>
          <button
            onClick={handleClearAll}
            onBlur={() => setConfirmClear(false)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${
              confirmClear
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-500/30'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {confirmClear ? 'Confirmar?' : 'Apagar tudo'}
          </button>
        </div>

        {lista.map((m) => {
          const review = m.review || {}
          const result = review.result || 'Desconhecido'
          const Icon = RESULT_ICONS[result] || Target
          const iconColor = RESULT_COLORS[result] || 'text-slate-400'
          const bgClass = RESULT_BG[result] || 'bg-white/5 border-white/10'
          const accuracy = review.stats?.accuracy ?? 0
          const accuracyColor =
            accuracy >= 80 ? 'text-emerald-400'
              : accuracy >= 60 ? 'text-amber-400'
                : 'text-rose-400'
          const totalMoves = review.stats?.total_moves ?? 0
          const cor = m.playerColor === 'w' ? 'Brancas' : m.playerColor === 'b' ? 'Pretas' : '—'

          return (
            <div
              key={m.id}
              onClick={() => onOpenMatch(m)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onOpenMatch(m)
                }
              }}
              role="button"
              tabIndex={0}
              className={`relative rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01] cursor-pointer ${bgClass}`}
            >
              <div className="w-full text-left px-4 py-3.5 flex items-center gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${iconColor}`}>{result}</span>
                    {review.result_reason && (
                      <span className="text-xs text-slate-500 truncate">— {review.result_reason}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(m.savedAt)}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>{cor}</span>
                    {m.difficulty != null && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span>Rating {m.difficulty}</span>
                      </>
                    )}
                    <span className="text-slate-600">·</span>
                    <span>{totalMoves} lances</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right min-w-[60px]">
                  {accuracy > 0 && (
                    <>
                      <p className={`text-lg font-bold ${accuracyColor}`}>{accuracy}%</p>
                      <p className="text-[10px] text-slate-500 uppercase">Precisão</p>
                    </>
                  )}
                </div>

                {/* Separador visual: lixeira fica longe do chevron. */}
                <div className="flex-shrink-0 flex items-center gap-3 pl-4 ml-2 border-l border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingMatch(m)
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                    title="Apagar partida"
                    aria-label="Apagar partida"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {deletingMatch && (
        <ConfirmDeleteModal
          onCancel={() => setDeletingMatch(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}

export default MatchHistoryView
