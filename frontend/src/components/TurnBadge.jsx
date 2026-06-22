/**
 * Traduz o motivo do fim de jogo para texto em português.
 */
function getGameOverText(reason, turn) {
  const winner = turn === 'w' ? 'Pretas' : 'Brancas'
  
  switch (reason) {
    case 'checkmate':
      return `Xeque-mate! ${winner} vencem`
    case 'stalemate':
      return 'Empate por afogamento (stalemate)'
    case 'threefold':
      return 'Empate por repetição tripla'
    case 'fiftyMoves':
      return 'Empate pela regra dos 50 lances'
    case 'insufficient':
      return 'Empate por material insuficiente'
    case 'draw':
      return 'Empate'
    default:
      return 'Fim de jogo'
  }
}

function TurnBadge({ turn, moveLabel, gameOver = false, gameOverReason = null }) {
  const isWhite = turn === 'w'

  return (
    <div
      className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-sm shadow-lg transition-colors duration-300 ${
        isWhite
          ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/20 shadow-white/5'
          : 'bg-gradient-to-r from-slate-700/40 to-slate-800/30 border-white/10 shadow-black/30'
      }`}
    >
      {!gameOver && (
        <>
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isWhite ? 'bg-white' : 'bg-slate-900 ring-1 ring-white/40'
            }`}
          />
          <span className="text-sm font-bold tracking-wide text-white uppercase">
            Vez das {isWhite ? 'brancas' : 'pretas'}
          </span>
        </>
      )}

      {gameOver && (
        <>
          <span className="w-3 h-3 rounded-full flex-shrink-0 bg-amber-400 animate-pulse" />
          <span className="text-sm font-bold tracking-wide text-amber-300 uppercase">
            {getGameOverText(gameOverReason, turn)}
          </span>
        </>
      )}

      {moveLabel && !gameOver && (
        <span className="text-xs font-mono text-slate-400 border-l border-white/10 pl-3">
          {moveLabel}
        </span>
      )}

      {gameOver && gameOverReason === 'fiftyMoves' && (
        <span className="text-xs text-slate-400 border-l border-white/10 pl-3">
          50 lances sem captura ou peão
        </span>
      )}
    </div>
  )
}

export default TurnBadge