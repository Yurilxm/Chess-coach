import { Bot, Zap } from 'lucide-react'

function BotDifficultySelector({ difficulty, onChange, presets, disabled = false }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dificuldade do Bot
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-1.5">
        {Object.values(presets).map((preset) => {
          const isSelected = difficulty === preset.value
          return (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              disabled={disabled}
              className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ring-1 ring-cyan-500/20'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/[0.08] hover:text-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-1.5">
                {isSelected && <Zap className="w-3 h-3 text-cyan-400" />}
                {preset.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BotDifficultySelector