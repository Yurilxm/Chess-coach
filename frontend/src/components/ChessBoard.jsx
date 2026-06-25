import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import './ChessBoard.css'

/**
 * Componente "burro": apenas espelha visualmente o estado que recebe via
 * props. Toda a lógica de regras de xadrez vive nos hooks useChessGame /
 * useChessEditor. Isso é proposital: ao não guardar nenhuma instância de
 * Chess.js aqui dentro, o tabuleiro nunca pode "misturar" Jogo e Editor.
 */
function ChessBoard({
  fen,
  orientation = 'white',
  boardWidth = 520,
  turnColor,
  check = false,
  lastMove,
  movableColor,
  freeMove = false,
  dests,
  showDests = true,
  autoShapes = [],
  onAfterMove,
  className = '',
}) {
  const boardRef = useRef(null)
  const apiRef = useRef(null)
  const onAfterMoveRef = useRef(onAfterMove)
  onAfterMoveRef.current = onAfterMove

  // Guarda o último fen que de fato foi sincronizado com o Chessground.
  // Usado para evitar reenviar `fen` no .set() quando ele não mudou (ver
  // comentário no efeito de sincronização abaixo).
  const lastSyncedFenRef = useRef(fen)

  const autoCastle = !freeMove

  const buildConfig = () => ({
    fen,
    orientation,
    turnColor,
    check,
    lastMove,
    coordinates: true,
    autoCastle,
    highlight: { lastMove: true, check: true },
    animation: { enabled: true, duration: 150 },
    drawable: { enabled: true, visible: true, autoShapes },
    // Desligado de propósito: o Chessground tem um sistema PRÓPRIO de
    // pré-jogada (premovable), ativado por padrão sempre que movable.color
    // é diferente de turnColor (exatamente nossa situação enquanto o bot
    // "pensa"). Esse sistema nativo ignora o `movable.dests` que a gente
    // calcula (getPremoveDests) e usa o gerador de destinos genérico dele
    // próprio — que tem comportamento incorreto para certas peças (ex: rei
    // "deslizando" pros lados) — e dispara um evento diferente
    // (premovable.events.set), não o movable.events.after que escutamos em
    // onAfterMove. Resultado: nosso handleAfterMove/addPremove nunca era
    // chamado, e os destinos mostrados vinham de outro lugar.
    // Desabilitando aqui, QUALQUER arrasto (seja sua vez ou não) passa a
    // respeitar só o `dests` que a gente manda e chama sempre
    // movable.events.after — a nossa fila de pré-jogadas assume o controle
    // total.
    premovable: { enabled: false },
    movable: {
      free: freeMove,
      color: movableColor,
      dests,
      showDests,
      events: {
        after: (orig, dest) => onAfterMoveRef.current?.(orig, dest),
      },
    },
  })

  // Inicializa o Chessground uma única vez
  useEffect(() => {
    if (!boardRef.current || apiRef.current) return
    apiRef.current = Chessground(boardRef.current, buildConfig())
    lastSyncedFenRef.current = fen
    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantém o Chessground sincronizado com o que vem de fora.
  //
  // IMPORTANTE: este efeito dispara não só quando o fen muda, mas também
  // quando `dests` muda — e isso acontece durante o premove, a cada
  // pré-jogada adicionada na fila (o array de dests é recalculado). Se
  // sempre incluíssemos `fen` no config passado pro Chessground, o `.set()`
  // reposicionaria TODAS as peças de acordo com aquele fen — e como nesse
  // momento o fen real do jogo ainda não mudou (a pré-jogada não é um
  // lance de verdade ainda), isso desfaria visualmente o arrasto que o
  // jogador acabou de fazer (o Chessground já tinha movido a peça por
  // conta própria, internamente, ao processar o drag).
  //
  // Por isso: só incluímos `fen` no config quando ele de fato mudou desde
  // a última sincronização. Quando só `dests`/`movable`/etc. mudaram (caso
  // típico do premove), omitimos `fen` do objeto — o Chessground então
  // atualiza apenas o resto da config, sem tocar na posição das peças.
  useEffect(() => {
    if (!apiRef.current) return

    const config = buildConfig()
    if (fen === lastSyncedFenRef.current) {
      delete config.fen
    } else {
      lastSyncedFenRef.current = fen
    }

    apiRef.current.set(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation, turnColor, check, lastMove, freeMove, movableColor, dests, showDests, autoShapes])

  return (
    <div
      className={`relative rounded-2xl p-[2px] bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent shadow-2xl shadow-black/50 ring-1 ring-white/10 ${className}`}
    >
      <div
        ref={boardRef}
        style={{ width: boardWidth, height: boardWidth }}
        className="rounded-[14px] overflow-hidden"
      />
    </div>
  )
}

export default ChessBoard