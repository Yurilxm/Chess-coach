import { BookOpen } from 'lucide-react'

/**
 * Exibe o nome da abertura detectada durante a partida.
 */
function OpeningBadge({ opening }) {
  if (!opening) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs">
      <BookOpen className="w-3 h-3 text-cyan-400" />
      <span className="text-cyan-300 font-medium">{opening.name}</span>
      <span className="text-cyan-500/60 font-mono text-[10px]">({opening.code})</span>
    </div>
  )
}

export default OpeningBadge