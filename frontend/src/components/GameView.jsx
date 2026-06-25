import { useMemo, useState } from 'react'
import ChessBoard from './ChessBoard'
import MoveHistoryPanel from './MoveHistoryPanel'
import PromotionModal from './PromotionModal'
import SecondaryButton from './SecondaryButton'
import TurnBadge from './TurnBadge'
import CapturedPieces from './CapturedPieces'
import OpeningBadge from './OpeningBadge'
import { getCapturedPieces } from '../utils/chessHelpers'
import { detectOpening } from '../utils/openings'
import { RefreshCw, Undo2, RotateCcw, Zap } from 'lucide-react'

function GameView({ game, boardWidth = 520, bestMoveUci, isBotMode = false, onBotReset }) {
  const [orientation, setOrientation] = useState('white')

  const autoShapes = useMemo(() => (
    bestMoveUci && bestMoveUci.length >= 4
      ? [{ orig: bestMoveUci.slice(0, 2), dest: bestMoveUci.slice(2, 4), brush: 'green' }]
      : []
  ), [bestMoveUci])

  const captured = useMemo(() => getCapturedPieces(game.history), [game.history])
  
  const opening = useMemo(() => {
    if (game.history.length > 20) return null
    return detectOpening(game.history)
  }, [game.history])

  // É "tempo de pré-jogada" quando estamos no modo Bot, o jogo não acabou
  // e não é a vez do jogador (ou seja, é a vez do bot pensar/jogar).
  const isPremoveTime = isBotMode && !game.isGameOver && game.turn !== game.playerColor

  function handleAfterMove(orig, dest) {
    if (isPremoveTime) {
      // Não é a vez do jogador: isso é uma pré-jogada, vai para o fim da fila
      game.addPremove(orig, dest)
      return
    }

    // Movimento normal, validado e executado de imediato
    game.attemptMove(orig, dest)
  }

  function handleFlip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  const moveLabel = game.moveCount > 0 ? `Lance ${game.moveCount}` : 'Início da partida'
  const whiteCaptured = captured.byWhite
  const blackCaptured = captured.byBlack
  const hasCapturedPieces = whiteCaptured.length > 0 || blackCaptured.length > 0

  const boardOrientation = isBotMode 
    ? (game.playerColor === 'b' ? 'black' : 'white')
    : orientation

  // No modo Bot, SEMPRE permite mexer as peças do jogador (para premove)
  // No modo normal, só na sua vez
  const movableColor = isBotMode
    ? (game.playerColor === 'w' ? 'white' : 'black')
    : (game.isGameOver ? undefined : (game.turn === 'w' ? 'white' : 'black'))

  // No modo Bot, SEMPRE mostra destinos das peças do jogador (para premove)
  const showDests = isBotMode 
    ? !game.isGameOver
    : true

  // Durante o tempo de pré-jogada, os destinos vêm de getPremoveDests()
  // (padrão de movimento de cada peça, ignorando de quem é a vez "real" —
  // é isso que corrige o peão "andando pro lado"). Fora desse tempo, usamos
  // os destinos normais de regras de xadrez (getDests).
  const dests = game.isGameOver
    ? new Map()
    : isPremoveTime
      ? game.getPremoveDests()
      : game.getDests()

  // O Chessground só libera o arrasto de uma peça quando `turnColor` bate
  // com a cor dela (a não ser que movable.free seja true, o que não é o
  // nosso caso — usamos free:false pra obrigar a respeitar `dests`).
  // Por isso, durante o "tempo de pré-jogada" (não é a vez do jogador), a
  // gente manda pro Chessground a cor do PRÓPRIO jogador como turnColor —
  // assim ele libera o arrasto normalmente, sem cair no sistema nativo de
  // premove dele (que ignora o nosso `dests` e tem destinos incorretos
  // para algumas peças, como o rei "deslizando"). Quem de fato decide se
  // o lance é legal é o nosso `dests`/handleAfterMove, não o Chessground —
  // esse turnColor "mentiroso" serve só pra ele não bloquear a interação.
  const turnColorForBoard = isPremoveTime
    ? (game.playerColor === 'w' ? 'white' : 'black')
    : (game.turn === 'w' ? 'white' : 'black')

  // Como turnColorForBoard pode estar "mentindo" pro Chessground durante
  // o premove, não usamos mais um booleano simples pro highlight de xeque
  // — passamos explicitamente a cor de quem está REALMENTE em xeque
  // (sempre quem tem a vez de verdade, game.turn), pra não destacar o
  // rei errado nesse momento.
  const checkColorForBoard = game.isCheck
    ? (game.turn === 'w' ? 'white' : 'black')
    : false

  function handleReset() {
    if (isBotMode && onBotReset) {
      onBotReset()
    } else {
      game.reset()
    }
  }

  const botLabel = isBotMode && game.playerColor 
    ? `Jogando de ${game.playerColor === 'w' ? 'brancas' : 'pretas'}`
    : null

  // Uma seta amarela para cada pré-jogada enfileirada
  const premoveShapes = useMemo(() => {
    return (game.premoveQueue || []).map((pm) => ({
      orig: pm.from,
      dest: pm.to,
      brush: 'yellow',
    }))
  }, [game.premoveQueue])

  const premoveCount = game.premoveQueue?.length || 0

  return (
    <div className="flex flex-col items-center gap-3">
      <TurnBadge 
        turn={game.turn} 
        moveLabel={moveLabel} 
        gameOver={game.isGameOver} 
        gameOverReason={game.gameOverReason}
        botLabel={botLabel}
      />
      
      <OpeningBadge opening={opening} />

      {/* Indicador de pré-jogada(s) na fila */}
      {premoveCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-400 animate-pulse">
          <Zap className="w-3 h-3" />
          {premoveCount === 1
            ? 'Pré-jogada pendente'
            : `${premoveCount} pré-jogadas na fila`}
        </div>
      )}

      <div 
        className="relative" 
        style={{ 
          width: boardWidth, 
          marginTop: hasCapturedPieces ? '22px' : '0',
          marginBottom: hasCapturedPieces ? '6px' : '0',
        }}
      >
        <div className="absolute -top-6 right-0">
          <CapturedPieces pieces={blackCaptured} color="w" />
        </div>

        <ChessBoard
          fen={game.fen}
          orientation={boardOrientation}
          boardWidth={boardWidth}
          turnColor={turnColorForBoard}
          check={checkColorForBoard}
          lastMove={game.lastMove}
          movableColor={movableColor}
          freeMove={false}
          dests={dests}
          showDests={showDests}
          autoShapes={[...autoShapes, ...premoveShapes]}
          onAfterMove={handleAfterMove}
        />

        <div className="absolute -bottom-6 left-0">
          <CapturedPieces pieces={whiteCaptured} color="b" />
        </div>
      </div>

      {!isBotMode && (
        <div className={`flex gap-2 ${hasCapturedPieces ? 'mt-5' : ''}`}>
          <SecondaryButton icon={RefreshCw} onClick={handleReset}>
            Nova partida
          </SecondaryButton>
          <SecondaryButton icon={Undo2} onClick={() => game.undo()} disabled={game.history.length === 0}>
            Desfazer
          </SecondaryButton>
          <SecondaryButton icon={RotateCcw} onClick={handleFlip}>
            Girar tabuleiro
          </SecondaryButton>
        </div>
      )}

      {isBotMode && premoveCount > 0 && (
        <div className="flex gap-2">
          <SecondaryButton icon={Undo2} onClick={() => game.removeLastPremove()}>
            Desfazer pré-jogada
          </SecondaryButton>
        </div>
      )}

      <div className={`w-full ${hasCapturedPieces ? 'mt-5' : ''}`}>
        <MoveHistoryPanel history={game.history} />
      </div>

      {game.pendingPromotion && (
        <PromotionModal
          color={game.pendingPromotion.color}
          onChoose={game.resolvePromotion}
          onCancel={game.cancelPromotion}
        />
      )}
    </div>
  )
}

export default GameView