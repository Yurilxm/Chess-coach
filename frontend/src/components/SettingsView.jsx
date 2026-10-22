import { useSettings } from '../contexts/useSettings'
import ChessBoard from './ChessBoard'
import { Settings, CheckCircle2 } from 'lucide-react'

export function SettingsView() {
  const { 
    boardTheme, setBoardTheme, 
    pieceTheme, setPieceTheme,
    boardThemes, pieceThemes 
  } = useSettings()

  const previewFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-6 h-6 text-slate-400" />
        <h2 className="text-2xl font-bold text-white">Configurações Visuais</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Preview</div>
          <div className="p-2 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
            <ChessBoard 
              fen={previewFen}
              boardWidth={400}
              showDests={false}
              freeMove={false}
              dests={new Map()}
            />
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Tema do Tabuleiro</h3>
            <div className="grid grid-cols-2 gap-2">
              {boardThemes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setBoardTheme(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    boardTheme === t.id ? 'bg-white/10 border-violet-500/50' : 'bg-slate-950/50 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="w-6 h-6 rounded-md shadow-inner flex-shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-slate-200">{t.name}</span>
                  {boardTheme === t.id && <CheckCircle2 className="w-4 h-4 text-violet-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Tema das Peças</h3>
            <div className="grid grid-cols-2 gap-2">
              {pieceThemes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setPieceTheme(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    pieceTheme === t.id ? 'bg-white/10 border-violet-500/50' : 'bg-slate-950/50 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs text-slate-200">{t.name}</span>
                  {pieceTheme === t.id && <CheckCircle2 className="w-4 h-4 text-violet-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
