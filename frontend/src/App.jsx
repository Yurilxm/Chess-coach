import { useEffect, useState, useCallback } from 'react'
import { Brain, Play, RefreshCw } from 'lucide-react'
import Header from './components/Header'
import GameView from './components/GameView'
import EditorView from './components/EditorView'
import EvalBar from './components/EvalBar'
import AnalysisPanel from './components/AnalysisPanel'
import AdvancedTools from './components/AdvancedTools'
import BotDifficultySelector from './components/BotDifficultySelector'
import { useChessGame } from './hooks/useChessGame'
import { useChessEditor } from './hooks/useChessEditor'
import { useStockfishAnalysis } from './hooks/useStockfishAnalysis'
import { useBotPlayer } from './hooks/useBotPlayer'
import { useCoach } from './hooks/useCoach'

function App() {
  const [mode, setMode] = useState('game')
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(0)
  const [botGameStarted, setBotGameStarted] = useState(false)

  const game = useChessGame()
  const editor = useChessEditor()
  const bot = useBotPlayer()

  const { analysis, loading, error, analyze, clear } = useStockfishAnalysis()
  const { coachExplanation, coachLoading, explainMove, clearCoach } = useCoach()

  const activeFen = mode === 'editor' ? editor.fen : game.fen

  useEffect(() => {
    clear()
    clearCoach()
    setSelectedMoveIndex(0)
  }, [activeFen, clear, clearCoach])

  // Reseta ao entrar no modo Bot
  useEffect(() => {
    if (mode === 'bot') {
      game.reset()
      game.setPlayerColor(null)
      setBotGameStarted(false)
    } else {
      game.setPlayerColor(null)
      setBotGameStarted(false)
    }
  }, [mode])

  // Iniciar jogo contra o bot
  function handleStartBotGame() {
    if (!game.playerColor) return
    setBotGameStarted(true)
    if (game.playerColor === 'b') {
      const timer = setTimeout(() => {
        bot.requestMove(game.fen).then((result) => {
          if (result?.from_square && result?.to_square) {
            game.attemptMove(result.from_square, result.to_square, {
              skipColorCheck: true,
              promotion: result.promotion,
            })
          }
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }

  // Bot joga automaticamente após cada lance do jogador
  useEffect(() => {
    if (mode !== 'bot') return
    if (!botGameStarted) return
    if (game.isGameOver) return
    if (!game.playerColor) return
    
    const botColor = game.playerColor === 'w' ? 'b' : 'w'
    
    if (game.turn !== botColor) return
    if (bot.thinking) return

    const timer = setTimeout(() => {
      bot.requestMove(game.fen).then((result) => {
        if (result?.from_square && result?.to_square) {
          game.attemptMove(result.from_square, result.to_square, {
            skipColorCheck: true,
            promotion: result.promotion,
          })
        }
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [game.fen, game.turn, game.isGameOver, game.playerColor, mode, botGameStarted])

  // Quando seleciona um lance, chama o coach automaticamente
  const handleSelectMove = useCallback((index) => {
    setSelectedMoveIndex(index)
    
    // Pega o lance selecionado e pede explicação para a IA
    const lines = analysis?.lines || []
    const selectedLine = lines[index]
    if (selectedLine?.move && activeFen) {
      explainMove(activeFen, selectedLine.move, selectedLine.evaluation)
    }
  }, [analysis, activeFen, explainMove])

  function handleAnalyze() {
    clearCoach()
    analyze(activeFen)
  }

  function handleImportFen(fen) {
    if (mode === 'editor') editor.loadFen(fen)
    else game.loadFen(fen)
  }

  function handleBotReset() {
    game.reset()
    game.setPlayerColor(null)
    setBotGameStarted(false)
  }

  const selectedBestMove = analysis?.lines?.[selectedMoveIndex]?.move 
    || analysis?.top_moves?.[selectedMoveIndex] 
    || analysis?.best_move

  const isBotMode = mode === 'bot'
  const isEditorMode = mode === 'editor'

  return (
    <div className="relative min-h-screen text-white font-sans flex flex-col overflow-x-hidden bg-slate-950">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#141e3c] via-[#1c2b58] to-[#2a1b52]" />
      <div className="fixed inset-0 -z-10 opacity-40 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="fixed -top-40 -left-40 -z-10 w-[600px] h-[600px] rounded-full bg-blue-500/25 blur-[130px] animate-pulse [animation-duration:9s]" />
      <div className="fixed top-1/3 -right-40 -z-10 w-[550px] h-[550px] rounded-full bg-violet-500/20 blur-[130px] animate-pulse [animation-duration:11s] [animation-delay:1.5s]" />
      <div className="fixed bottom-0 left-1/3 -z-10 w-[500px] h-[400px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse [animation-duration:13s] [animation-delay:3s]" />
      <div className="fixed top-1/2 left-1/2 -z-10 w-[900px] h-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-[160px] animate-pulse [animation-duration:15s] [animation-delay:0.8s]" />

      <Header mode={mode} onModeChange={setMode} />

      <main className="relative z-10 flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="relative w-full rounded-[32px] bg-white/[0.035] backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl shadow-black/30 p-5 md:p-8">
          <div className="flex gap-6 justify-center items-start flex-wrap lg:flex-nowrap">
            <div className="flex gap-3 items-stretch">
              <EvalBar evaluation={analysis?.evaluation} orientation="vertical" />

              {isEditorMode ? (
                <EditorView editor={editor} boardWidth={520} bestMoveUci={selectedBestMove} />
              ) : (
                <GameView 
                  game={game} 
                  boardWidth={520} 
                  bestMoveUci={selectedBestMove} 
                  isBotMode={isBotMode}
                  onBotReset={handleBotReset}
                />
              )}
            </div>

            <div className="flex flex-col gap-4 w-full max-w-[380px]">
              {/* Modo Bot: configuração antes de começar */}
              {isBotMode && !botGameStarted && (
                <>
                  <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Escolha sua cor
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => game.setPlayerColor('w')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          game.playerColor === 'w'
                            ? 'bg-white/15 text-white border-white/30 ring-1 ring-white/20'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white border border-white/40 flex-shrink-0" />
                        Brancas
                      </button>
                      <button
                        onClick={() => game.setPlayerColor('b')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          game.playerColor === 'b'
                            ? 'bg-slate-700/80 text-white border-white/20 ring-1 ring-white/20'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-900 ring-1 ring-white/40 flex-shrink-0" />
                        Pretas
                      </button>
                    </div>
                  </div>

                  <BotDifficultySelector
                    difficulty={bot.difficulty}
                    onChange={bot.setDifficulty}
                  />

                  <button
                    onClick={handleStartBotGame}
                    disabled={!game.playerColor}
                    className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5 text-base flex items-center justify-center gap-3"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar Partida
                  </button>
                </>
              )}

              {/* Modo Bot: durante o jogo */}
              {isBotMode && botGameStarted && (
                <button
                  onClick={handleBotReset}
                  className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-2xl transition-all duration-200 cursor-pointer border border-white/10 text-base flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  Nova Partida
                </button>
              )}

              {isBotMode && bot.thinking && (
                <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl border border-cyan-500/20 p-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-cyan-300">Bot está pensando...</span>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!activeFen || loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 text-base flex items-center justify-center gap-3"
              >
                <Brain className="w-5 h-5" />
                {loading ? 'Analisando...' : 'Analisar posição'}
              </button>

              <AnalysisPanel 
                fen={activeFen} 
                analysis={analysis} 
                loading={loading} 
                error={error}
                selected={selectedMoveIndex}
                onSelect={handleSelectMove}
                coachExplanation={coachExplanation}
                coachLoading={coachLoading}
              />

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