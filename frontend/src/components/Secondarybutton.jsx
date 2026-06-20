function SecondaryButton({ icon: Icon, children, onClick, disabled = false, tone = 'neutral' }) {
  const toneHover = tone === 'warning'
    ? 'hover:border-rose-500/30 hover:text-rose-200 hover:from-rose-500/15 hover:to-rose-600/5'
    : 'hover:border-emerald-500/25 hover:text-emerald-200 hover:from-emerald-500/15 hover:to-emerald-600/5'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 shadow-sm shadow-black/20 backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 ${toneHover} disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />}
      {children}
    </button>
  )
}

export default SecondaryButton