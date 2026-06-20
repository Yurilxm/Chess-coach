import { Chess } from 'chess.js'

export const PIECE_NAMES_PT = {
  p: 'Peão',
  n: 'Cavalo',
  b: 'Bispo',
  r: 'Torre',
  q: 'Dama',
  k: 'Rei',
}

export function pieceNamePt(type) {
  return PIECE_NAMES_PT[type] || 'Peça'
}

/**
 * Recebe um lance no formato verbose do chess.js
 * { piece, from, to, captured, promotion, flags, san, color }
 * e devolve uma descrição em português, ex: "Peão de e2 para e4".
 */
export function describeMoveObject(move) {
  if (!move) return ''

  if (move.san === 'O-O') return 'Roque pequeno (lado do rei)'
  if (move.san === 'O-O-O') return 'Roque grande (lado da dama)'

  const pieceName = pieceNamePt(move.piece)
  let text = `${pieceName} de ${move.from} para ${move.to}`

  if (move.captured) {
    text += `, capturando ${pieceNamePt(move.captured).toLowerCase()}`
  }
  if (move.promotion) {
    text += `, promovendo a ${pieceNamePt(move.promotion).toLowerCase()}`
  }
  return text
}

/**
 * Converte um lance em notação UCI (ex: "e2e4", "e7e8q") em uma descrição
 * humana, a partir do FEN da posição ANTES do lance ser jogado.
 * Retorna null se o lance não puder ser interpretado naquela posição.
 */
export function describeUciMove(fen, uci) {
  if (!fen || !uci || uci.length < 4) return null

  const from = uci.substring(0, 2)
  const to = uci.substring(2, 4)
  const promotion = uci.length > 4 ? uci.substring(4, 5) : 'q'

  try {
    const temp = new Chess(fen)
    const move = temp.move({ from, to, promotion })
    if (!move) {
      console.warn('[moveTranslation] Lance UCI não pôde ser aplicado nesta posição:', uci, '| FEN:', fen)
      return null
    }
    return {
      text: describeMoveObject(move),
      from,
      to,
      piece: move.piece,
      color: move.color,
      captured: move.captured || null,
      san: move.san,
    }
  } catch (err) {
    console.warn('[moveTranslation] Erro ao interpretar lance UCI:', uci, '| FEN:', fen, '| erro:', err?.message)
    return null
  }
}

const CENTER_SQUARES = ['d4', 'd5', 'e4', 'e5']
const BACK_RANK = { w: '1', b: '8' }

/**
 * Gera uma explicação simples e didática para um lance, com base em
 * heurísticas básicas (captura, xeque, centro, desenvolvimento...).
 * Importante: isso NÃO é o raciocínio do Stockfish, é uma camada de
 * didática construída em cima do resultado da engine.
 */
export function explainMoveHeuristic(moveInfo) {
  if (!moveInfo) return ''

  if (moveInfo.san === 'O-O' || moveInfo.san === 'O-O-O') {
    return 'Coloca o rei em uma posição mais segura e conecta as torres para o restante da partida.'
  }
  if (moveInfo.captured) {
    return `Captura ${pieceNamePt(moveInfo.captured).toLowerCase()} adversário, ganhando material.`
  }
  if (moveInfo.san?.includes('#')) {
    return 'Dá xeque-mate, encerrando a partida.'
  }
  if (moveInfo.san?.includes('+')) {
    return 'Dá xeque ao rei adversário, forçando uma resposta imediata.'
  }
  if (CENTER_SQUARES.includes(moveInfo.to)) {
    return 'Ocupa o centro do tabuleiro, ganhando espaço e controle sobre casas importantes.'
  }
  if ((moveInfo.piece === 'n' || moveInfo.piece === 'b') && moveInfo.from?.[1] === BACK_RANK[moveInfo.color]) {
    return 'Desenvolve uma peça, tirando-a da posição inicial para ficar mais ativa no jogo.'
  }
  if (moveInfo.piece === 'p') {
    return 'Avança um peão, ganhando espaço e abrindo linhas para as outras peças.'
  }
  if (moveInfo.piece === 'r') {
    return 'Ativa a torre, geralmente buscando uma coluna aberta ou semiaberta.'
  }
  if (moveInfo.piece === 'q') {
    return 'Reposiciona a dama para uma casa mais ativa.'
  }
  if (moveInfo.piece === 'k') {
    return 'Move o rei para uma posição mais segura.'
  }
  return 'Melhora a posição das peças e mantém o controle do jogo.'
}

/**
 * Texto qualitativo de vantagem/risco por posição no ranking do motor
 * (0 = melhor lance, 1 = segunda opção, 2 = terceira opção).
 *
 * Importante: o backend hoje retorna apenas a lista de lances (top_moves),
 * sem uma avaliação numérica individual por lance. Por isso este texto é
 * uma leitura qualitativa baseada na posição no ranking, não um valor
 * exato de centipawns por opção.
 */
const OPTION_INSIGHTS = [
  {
    label: 'Melhor lance',
    advantage: 'Esta é a linha mais precisa encontrada pelo motor nesta posição.',
    risk: 'Nenhum risco adicional identificado pelo motor nesta profundidade de busca.',
  },
  {
    label: 'Segunda opção',
    advantage: 'Mantém boa parte da vantagem, com uma abordagem ligeiramente diferente.',
    risk: 'É um pouco menos precisa que a melhor opção — pode ceder uma fração da vantagem.',
  },
  {
    label: 'Terceira opção',
    advantage: 'Tende a ser mais sólida ou defensiva, simplificando a posição.',
    risk: 'Normalmente cede mais vantagem do que as duas primeiras opções.',
  },
]

export function getOptionInsight(rank) {
  return OPTION_INSIGHTS[rank] || OPTION_INSIGHTS[OPTION_INSIGHTS.length - 1]
}