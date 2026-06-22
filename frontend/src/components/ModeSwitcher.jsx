import { BookOpen, PenLine, Bot } from 'lucide-react'

function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl p-1 ring-1 ring-white/10">
      <button
        onClick={() => onChange('game')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          mode === 'game'
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <BookOpen className="w-4 h-4" />
        Jogar
      </button>
      <button
        onClick={() => onChange('bot')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          mode === 'bot'
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Bot className="w-4 h-4" />
        vs Bot
      </button>
      <button
        onClick={() => onChange('editor')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          mode === 'editor'
            ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-md shadow-violet-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <PenLine className="w-4 h-4" />
        Editor
      </button>
    </div>
  )
}

export default ModeSwitcher