import { Brain } from 'lucide-react'
import ModeSwitcher from './ModeSwitcher'

function Header({ editorMode, onModeChange }) {
  return (
    <header className="relative z-10 border-b border-white/5 px-6 py-4 flex-shrink-0 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Chess Coach</h1>
            <p className="text-[11px] text-slate-500 -mt-0.5">Aprenda xadrez com análise inteligente</p>
          </div>
        </div>

        <ModeSwitcher editorMode={editorMode} onChange={onModeChange} />
      </div>
    </header>
  )
}

export default Header