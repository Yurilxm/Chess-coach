import { useMemo } from 'react'
import {
  ArrowLeft, ArrowRight, RotateCcw, Lightbulb, ChevronLeft, ChevronRight,
  Play, SkipBack, CheckCircle2, XCircle, GraduationCap,
} from 'lucide-react'
import ChessBoard from './ChessBoard'
import { useLesson } from '../hooks/useLesson'


// Renderiza a explicacao: separa por linhas em branco, trata **bold** como
// negrito simples. Sem dependencia de markdown externo.
function renderExplanation(text) {
  if (!text) return null
  const paragrafos = text.split(/\n\n+/)
  return paragrafos.map((p, i) => {
    const partes = p.split(/\*\*(.+?)\*\*/g)
    return (
      <p key={i} className="text-sm text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
        {partes.map((parte, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-white font-semibold">{parte}</strong>
            : <span key={j}>{parte}</span>
        )}
      </p>
    )
  })
}


function LessonView({ lesson, onBack }) {
  const {
    exerciseIndex,
    currentExercise,
    isLastExercise,
    totalExercises,
    displayFen,
    dests,
    turnColor,
    boardKey,
    feedback,
    hintVisible,
    demoFen,
    demoStep,
    totalDemoSteps,
    lessonProgress,
    tryMove,
    nextExercise,
    prevExercise,
    retryExercise,
    showHint,
    demoNext,
    demoPrev,
    demoReset,
  } = useLesson(lesson, onBack)

  // Seta verde do exercicio: quando erra, mostra a solucao esperada.
  const exerciseShapes = useMemo(() => {
    if (!feedback || !feedback.expected) return []
    const uci = feedback.expected
    if (uci.length < 4) return []
    return [{ orig: uci.slice(0, 2), dest: uci.slice(2, 4), brush: 'green' }]
  }, [feedback])

  // Seta azul da demo: mostra o ultimo lance da sequencia.
  const demoShapes = useMemo(() => {
    if (!lesson?.demo?.moves || demoStep === 0) return []
    const uci = lesson.demo.moves[demoStep - 1]
    if (!uci || uci.length < 4) return []
    return [{ orig: uci.slice(0, 2), dest: uci.slice(2, 4), brush: 'blue' }]
  }, [lesson, demoStep])

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          title="Voltar para a lista"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
            {lessonProgress?.completed && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                Concluída
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{lesson.objective}</p>
        </div>
      </div>

      {/* Explicação */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Explicação
        </h3>
        {renderExplanation(lesson.explanation)}
      </div>

      {/* Demonstração */}
      {lesson.demo && (
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Demonstração
          </h3>
          {lesson.demo.description && (
            <p className="text-sm text-slate-400 mb-3">{lesson.demo.description}</p>
          )}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ChessBoard
              fen={demoFen}
              boardWidth={440}
              showDests={false}
              freeMove={false}
              dests={new Map()}
              autoShapes={demoShapes}
            />
            <div className="flex-1 flex flex-col gap-3 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={demoReset}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Reiniciar demonstração"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={demoPrev}
                  disabled={demoStep <= 0}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 min-w-[80px] text-center">
                  {demoStep}/{totalDemoSteps}
                </span>
                <button
                  onClick={demoNext}
                  disabled={demoStep >= totalDemoSteps}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    demoReset()
                    // Vai ate o fim
                    const total = totalDemoSteps
                    let i = 0
                    const tick = () => {
                      if (i >= total) return
                      demoNext()
                      i++
                      setTimeout(tick, 800)
                    }
                    setTimeout(tick, 200)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  title="Reproduzir do início"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Use os controles para ver a sequência de lances da demonstração.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exercícios */}
      {currentExercise && (
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Exercício {exerciseIndex + 1} de {totalExercises}
            </h3>
            {currentExercise.rating && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500">
                Rating {currentExercise.rating}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-300 mb-4">{currentExercise.prompt}</p>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ChessBoard
              key={`${exerciseIndex}-${boardKey}`}
              fen={displayFen}
              boardWidth={440}
              turnColor={turnColor}
              movableColor={turnColor}
              dests={dests}
              showDests={true}
              freeMove={false}
              onAfterMove={(from, to) => tryMove(from, to)}
              autoShapes={exerciseShapes}
            />

            <div className="flex-1 flex flex-col gap-3 w-full">
              {/* Feedback */}
              {feedback && (
                <div className={`rounded-xl p-3 border flex items-start gap-2 ${
                  feedback.status === 'correct'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : feedback.status === 'wrong'
                      ? 'bg-rose-500/10 border-rose-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  {feedback.status === 'correct' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-xs leading-relaxed ${
                    feedback.status === 'correct' ? 'text-emerald-200' : 'text-rose-200'
                  }`}>
                    {feedback.message}
                  </p>
                </div>
              )}

              {/* Dica */}
              {hintVisible && currentExercise.hint && (
                <div className="rounded-xl p-3 border bg-amber-500/5 border-amber-500/20 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 leading-relaxed">{currentExercise.hint}</p>
                </div>
              )}

              {/* Botões */}
              <div className="flex flex-wrap gap-2">
                {!hintVisible && currentExercise.hint && (
                  <button
                    onClick={showHint}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Dica
                  </button>
                )}
                {feedback && feedback.status !== 'correct' && (
                  <button
                    onClick={retryExercise}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tentar de novo
                  </button>
                )}
              </div>

              {/* Navegação */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <button
                  onClick={prevExercise}
                  disabled={exerciseIndex === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <button
                  onClick={nextExercise}
                  disabled={feedback?.status !== 'correct'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isLastExercise ? 'Concluir lição' : 'Próximo'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo */}
      {lesson.summary && (
        <div className="rounded-2xl bg-violet-500/5 border border-violet-500/10 p-5">
          <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
            Resumo
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">{lesson.summary}</p>
        </div>
      )}
    </div>
  )
}

export default LessonView
