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
      {/* Base: gradiente azul petróleo / roxo — mais claro e com mais profundidade que antes */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#141e3c] via-[#1c2b58] to-[#2a1b52]" />

      {/* Grid sutil estilo Linear/Vercel */}
      <div className="fixed inset-0 -z-10 opacity-40 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />

      {/* Glows com pulso lento e discreto — incluindo um central, pra iluminar
          o meio da tela e não deixar só as bordas claras */}
      <div className="fixed -top-40 -left-40 -z-10 w-[600px] h-[600px] rounded-full bg-blue-500/25 blur-[130px] animate-pulse [animation-duration:9s]" />
      <div className="fixed top-1/3 -right-40 -z-10 w-[550px] h-[550px] rounded-full bg-violet-500/20 blur-[130px] animate-pulse [animation-duration:11s] [animation-delay:1.5s]" />
      <div className="fixed bottom-0 left-1/3 -z-10 w-[500px] h-[400px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse [animation-duration:13s] [animation-delay:3s]" />
      <div className="fixed top-1/2 left-1/2 -z-10 w-[900px] h-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-[160px] animate-pulse [animation-duration:15s] [animation-delay:0.8s]" />

      <Header editorMode={editorMode} onModeChange={setEditorMode} />

      <main className="relative z-10 flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Painel de vidro: glassmorphism por cima do fundo colorido, deixa
            as cores "vazarem" suavemente por trás do conteúdo */}
        <div className="relative w-full rounded-[32px] bg-white/[0.035] backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl shadow-black/30 p-5 md:p-8">
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
        </div>
      </main>
    </div>
  )
}

export default App