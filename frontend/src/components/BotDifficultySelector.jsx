import { Bot, ChevronLeft, ChevronRight } from 'lucide-react'
import { DIFFICULTY_LEVELS } from '../hooks/useBotPlayer'

const LEVELS = Object.keys(DIFFICULTY_LEVELS).map(Number).sort((a, b) => a - b)

function BotDifficultySelector({ difficulty, onChange, disabled = false }) {
  const currentLevel = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS[1000]
  
  const currentIndex = LEVELS.indexOf(difficulty)
  const minLevel = LEVELS[0]
  const maxLevel = LEVELS[LEVELS.length - 1]
  const progress = ((difficulty - minLevel) / (maxLevel - minLevel)) * 100

  function handlePrev() {
    const prevIndex = Math.max(0, currentIndex - 1)
    onChange(LEVELS[prevIndex])
  }

  function handleNext() {
    const nextIndex = Math.min(LEVELS.length - 1, currentIndex + 1)
    onChange(LEVELS[nextIndex])
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dificuldade do Bot
        </span>
      </div>

      {/* Nome e rating */}
      <div className="text-center mb-3">
        <p className="text-sm font-semibold text-white">{currentLevel.name}</p>
        <p className="text-2xl font-bold text-cyan-400">{difficulty}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Rating Chess Coach</p>
      </div>

      {/* Slider + botões */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={disabled || difficulty <= minLevel}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={minLevel}
            max={maxLevel}
            step={200}
            value={difficulty}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <button
          onClick={handleNext}
          disabled={disabled || difficulty >= maxLevel}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Descrição */}
      <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
        {currentLevel.desc}
      </p>
    </div>
  )
}

export default BotDifficultySelector