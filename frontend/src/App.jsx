import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'
import Header from './components/Header'
import GameView from './components/GameView'
import EditorView from './components/EditorView'
import EvalBar from './components/EvalBar'
import AnalysisPanel from './components/AnalysisPanel'
import AdvancedTools from './components/AdvancedTools'
import { useChessGame } from './hooks/useChessGame'
import { useChessEditor } from './hooks/useChessEditor'
import { useStockfishAnalysis } from './hooks/useStockfishAnalysis'

function App() {
  const [editorMode, setEditorMode] = useState(false)

  // Estados completamente independentes: mover peças em um nunca afeta o outro.
  const game = useChessGame()
  const editor = useChessEditor()

  const { analysis, loading, error, analyze, clear } = useStockfishAnalysis()

  const activeFen = editorMode ? editor.fen : game.fen

  // Toda vez que a posição ativa muda (lance, edição ou troca de modo),
  // a análise anterior deixa de corresponder à posição exibida.
  useEffect(() => {
    clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFen])

  function handleAnalyze() {
    analyze(activeFen)
  }

  function handleImportFen(fen) {
    if (editorMode) editor.loadFen(fen)
    else game.loadFen(fen)
  }

  return (
    <div className="relative min-h-screen text-white font-sans flex flex-col overflow-x-hidden bg-slate-950">
      {/* Fundo premium: gradiente azul petróleo + glow suave, sem preto sólido */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0b1120] via-[#0e1730] to-[#0a0f1f]" />
      <div className="fixed -top-40 -left-40 -z-10 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="fixed top-1/3 -right-40 -z-10 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px]" />

      <Header editorMode={editorMode} onModeChange={setEditorMode} />

      <main className="relative z-10 flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex gap-6 justify-center items-start flex-wrap lg:flex-nowrap">
          <div className="flex gap-3 items-stretch">
            <EvalBar evaluation={analysis?.evaluation} orientation="vertical" />

            {editorMode ? (
              <EditorView editor={editor} boardWidth={520} bestMoveUci={analysis?.best_move} />
            ) : (
              <GameView game={game} boardWidth={520} bestMoveUci={analysis?.best_move} />
            )}
          </div>

          <div className="flex flex-col gap-4 w-full max-w-[380px]">
            <button
              onClick={handleAnalyze}
              disabled={!activeFen || loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 text-base flex items-center justify-center gap-3"
            >
              <Brain className="w-5 h-5" />
              {loading ? 'Analisando...' : 'Analisar posição'}
            </button>

            <AnalysisPanel fen={activeFen} analysis={analysis} loading={loading} error={error} />

            <AdvancedTools fen={activeFen} onImportFen={handleImportFen} />

            {!analysis && !loading && !error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
                  <Brain className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm max-w-[250px] mx-auto">
                  Faça um lance ou ajuste a posição e clique em "Analisar posição" para receber dicas do coach.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App