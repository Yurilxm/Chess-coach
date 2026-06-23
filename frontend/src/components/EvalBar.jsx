import { evalDescriptionPt, evalToWhitePercent, formatEvalScore } from '../utils/evaluation'

function EvalBar({ evaluation, orientation = 'vertical' }) {
  const whitePercent = evalToWhitePercent(evaluation)
  const description = evalDescriptionPt(evaluation)
  const scoreLabel = formatEvalScore(evaluation)

  if (orientation === 'horizontal') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-200">{description}</span>
          {evaluation && <span className="text-xs font-mono text-slate-400">{scoreLabel}</span>}
        </div>
        <div className="relative h-3 w-full rounded-full overflow-hidden bg-slate-600 ring-1 ring-white/10">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-100 to-white transition-all duration-500 ease-out"
            style={{ width: `${whitePercent}%` }}
          />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/15" />
        </div>
      </div>
    )
  }

  return (
    <div className="hidden sm:flex flex-col items-center gap-2 w-9 flex-shrink-0">
      <span className="text-[10px] font-bold text-slate-300">B</span>
      <div className="relative flex-1 w-4 min-h-[480px] rounded-full overflow-hidden ring-1 ring-white/10 bg-slate-600">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-slate-100 transition-all duration-500 ease-out"
          style={{ height: `${whitePercent}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-300">P</span>
      {evaluation && (
        <span className="text-[11px] font-mono font-bold text-slate-200 bg-slate-800/80 rounded-md px-1.5 py-0.5">
          {scoreLabel}
        </span>
      )}
    </div>
  )
}

export default EvalBar