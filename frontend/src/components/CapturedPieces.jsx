// Usando SEMPRE os símbolos brancos (mais bonitos)
const SYMBOLS = {
  q: '♕', r: '♖', b: '♗', n: '♘', p: '♙'
}

// Ordem de valor: dama, torre, bispo, cavalo, peão
const VALUE_ORDER = { q: 0, r: 1, b: 2, n: 3, p: 4 }

/**
 * @param pieces - lista de tipos de peça capturadas (ex: ['p','p','n'])
 * @param color - cor das peças capturadas ('w' ou 'b'), usada só pra cor do texto
 */
function CapturedPieces({ pieces, color }) {
  if (!pieces || pieces.length === 0) return null

  const sorted = [...pieces].sort((a, b) => VALUE_ORDER[a] - VALUE_ORDER[b])

  return (
    <div className="flex items-center gap-0.5">
      {sorted.map((type, i) => (
        <span key={i} className="text-lg leading-none opacity-80">
          {SYMBOLS[type]}
        </span>
      ))}
    </div>
  )
}

export default CapturedPieces