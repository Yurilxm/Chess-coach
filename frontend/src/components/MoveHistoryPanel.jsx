function MoveHistoryPanel({ history }) {
  if (!history || history.length === 0) return null
  const rows = Math.ceil(history.length / 2)

  return (
    <div className="w-full max-h-48 overflow-y-auto rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-white/10 p-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs border-b border-white/10">
            <th className="py-1.5 text-left font-semibold w-8">#</th>
            <th className="py-1.5 text-left font-semibold">Brancas</th>
            <th className="py-1.5 text-left font-semibold">Pretas</th>
          </tr>
        </thead>
        <tbody className="font-mono text-slate-200">
          {Array.from({ length: rows }, (_, i) => {
            const white = history[i * 2]
            const black = history[i * 2 + 1]
            return (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                <td className="py-1.5 text-slate-500 text-xs">{i + 1}</td>
                <td className="py-1.5 font-semibold">{white?.san ?? ''}</td>
                <td className="py-1.5">{black?.san ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default MoveHistoryPanel