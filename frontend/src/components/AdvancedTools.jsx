import { useState } from 'react'
import { ChevronDown, Copy, Upload, Check, Settings2 } from 'lucide-react'

function AdvancedTools({ fen, onImportFen }) {
  const [open, setOpen] = useState(false)
  const [fenInput, setFenInput] = useState('')
  const [copied, setCopied] = useState(false)

  function copyFen() {
    if (!fen) return
    navigator.clipboard.writeText(fen)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleImport() {
    if (!fenInput.trim()) return
    onImportFen(fenInput.trim())
    setFenInput('')
    setOpen(false)
  }

  return (
    <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-sm shadow-black/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors group"
      >
        <span className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
            <Settings2 className="w-3.5 h-3.5" />
          </span>
          Ferramentas avançadas
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          {fen && (
            <div>
              <p className="text-xs text-slate-500 mb-2">FEN atual</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs text-slate-500 bg-slate-950/60 rounded-xl p-3 break-all font-mono ring-1 ring-white/5">
                  {fen}
                </code>
                <button
                  onClick={copyFen}
                  className="px-3 py-2 bg-slate-950/60 hover:bg-white/10 ring-1 ring-white/5 hover:ring-white/15 rounded-xl transition-all duration-200 flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 mb-2">Importar posição (FEN)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="Cole o FEN..."
                className="flex-1 bg-slate-950/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all border border-white/10"
              />
              <button
                onClick={handleImport}
                disabled={!fenInput.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedTools