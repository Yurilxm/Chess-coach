import { Palette, X } from 'lucide-react'
import { useBoardTheme, THEMES } from '../hooks/useBoardTheme'

export function BoardThemeModal({ onClose }) {
  const { theme, setTheme } = useBoardTheme()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Palette className="w-5 h-5 text-violet-400" />
            Tema do Tabuleiro
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); onClose(); }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                theme === t.id ? 'bg-white/10 border-violet-500/50' : 'bg-slate-950/50 border-white/5 hover:bg-white/5'
              }`}
            >
              <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: t.color }} />
              <span className="text-sm text-slate-200">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
