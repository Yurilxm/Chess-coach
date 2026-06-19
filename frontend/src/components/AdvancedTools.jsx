import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Upload, Check, Settings2 } from 'lucide-react'

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
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-medium text-slate-400 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Ferramentas avançadas
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          {fen && (
            <div>
              <p className="text-xs text-slate-500 mb-2">FEN atual</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs text-slate-500 bg-slate-950/60 rounded-xl p-3 break-all font-mono">
                  {fen}
                </code>
                <button
                  onClick={copyFen}
                  className="px-3 py-2 bg-slate-950/60 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
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
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-violet-500/10"
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