import { BookOpen, PenLine } from 'lucide-react'

function ModeSwitcher({ editorMode, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl p-1 ring-1 ring-white/10">
      <button
        onClick={() => onChange(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          !editorMode
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <BookOpen className="w-4 h-4" />
        Modo Jogo
      </button>
      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          editorMode
            ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-md shadow-violet-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <PenLine className="w-4 h-4" />
        Modo Editor
      </button>
    </div>
  )
}

export default ModeSwitcher