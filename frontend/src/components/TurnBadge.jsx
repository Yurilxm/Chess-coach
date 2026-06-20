function TurnBadge({ turn, moveLabel, gameOver = false }) {
  const isWhite = turn === 'w'

  return (
    <div
      className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-sm shadow-lg transition-colors duration-300 ${
        isWhite
          ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/20 shadow-white/5'
          : 'bg-gradient-to-r from-slate-700/40 to-slate-800/30 border-white/10 shadow-black/30'
      }`}
    >
      <span
        className={`w-3 h-3 rounded-full flex-shrink-0 ${
          isWhite ? 'bg-white' : 'bg-slate-900 ring-1 ring-white/40'
        }`}
      />
      <span className="text-sm font-bold tracking-wide text-white uppercase">
        Vez das {isWhite ? 'brancas' : 'pretas'}
      </span>
      {moveLabel && (
        <span className="text-xs font-mono text-slate-400 border-l border-white/10 pl-3">
          {moveLabel}
        </span>
      )}
      {gameOver && (
        <span className="text-xs font-semibold text-amber-300 border-l border-white/10 pl-3">
          Fim de jogo
        </span>
      )}
    </div>
  )
}

export default TurnBadge