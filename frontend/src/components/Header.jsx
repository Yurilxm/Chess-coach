import { Brain } from 'lucide-react'
import ModeSwitcher from './ModeSwitcher'

function Header({ mode, onModeChange }) {
  const subtitles = {
    game: 'Aprenda xadrez com análise inteligente',
    bot: 'Desafie o computador',
    editor: 'Monte posições livremente',
  }

  return (
    <header className="relative z-10 border-b border-white/5 px-6 py-4 flex-shrink-0 backdrop-blur-md bg-slate-950/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-1 ring-white/20">
            <Brain className="w-5 h-5 text-white" />
            <div className="absolute inset-0 -z-10 rounded-xl bg-emerald-400/30 blur-md" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Chess Coach</h1>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide mt-1">
              {subtitles[mode] || subtitles.game}
            </p>
          </div>
        </div>

        <ModeSwitcher mode={mode} onChange={onModeChange} />
      </div>
    </header>
  )
}

export default Header