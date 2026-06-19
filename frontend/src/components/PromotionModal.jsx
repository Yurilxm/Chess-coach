const PROMOTION_PIECES = [
  { code: 'q', label: 'Dama' },
  { code: 'r', label: 'Torre' },
  { code: 'b', label: 'Bispo' },
  { code: 'n', label: 'Cavalo' },
]

const SYMBOLS = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞' },
}

function PromotionModal({ color, onChoose, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        className="flex flex-col gap-5 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 p-7 ring-1 ring-white/10 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-sm font-semibold text-slate-200 tracking-wide">
          Escolha a peça para promoção
        </p>
        <div className="flex gap-3">
          {PROMOTION_PIECES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => onChoose(code)}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-slate-700/70 px-5 py-4 text-slate-100 ring-1 ring-white/5 transition-all duration-200 hover:bg-gradient-to-b hover:from-emerald-500 hover:to-emerald-600 hover:scale-[1.06] hover:shadow-lg hover:shadow-emerald-500/30"
            >
              <span className="text-4xl leading-none transition-transform duration-200 group-hover:scale-110">
                {SYMBOLS[color]?.[code]}
              </span>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromotionModal