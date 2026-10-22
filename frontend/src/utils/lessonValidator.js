import { Chess } from 'chess.js'


/**
 * Aplica uma sequencia de lances UCI a uma posicao FEN e devolve o FEN
 * resultante. Usado para pre-posicionar o tabuleiro quando o exercicio
 * tem um "setup" (ex: puzzles do Lichess, onde o primeiro move ja foi
 * feito pelo adversario).
 *
 * Se algum lance for ilegal, devolve o FEN original (fail-safe).
 */
export function applySetup(fen, setupMoves) {
  if (!setupMoves || setupMoves.length === 0) return fen

  const chess = new Chess(fen)
  for (const uci of setupMoves) {
    try {
      const from = uci.substring(0, 2)
      const to = uci.substring(2, 4)
      const promo = uci.length > 4 ? uci.substring(4, 5) : undefined
      const moved = promo
        ? chess.move({ from, to, promotion: promo })
        : chess.move({ from, to })
      if (!moved) return fen
    } catch {
      return fen
    }
  }
  return chess.fen()
}


/**
 * Normaliza um lance UCI para comparacao:
 * - lowercase
 * - se peao chega na ultima fileira sem promo, adiciona 'q' (dama default)
 *
 * Recebe o estado do chess.js ANTES do lance, para saber qual peca se move.
 */
function normalizeUci(chess, from, to, promotion) {
  const piece = chess.get(from)
  let promo = promotion || ''
  if (piece?.type === 'p') {
    const lastRank = piece.color === 'w' ? '8' : '1'
    if (to[1] === lastRank && !promo) promo = 'q'
  }
  return (from + to + promo).toLowerCase()
}


/**
 * Valida um lance do usuario contra a lista de respostas esperadas.
 *
 * Aceita como valido se o lance for legal E casar com qualquer item de
 * `expected` (que pode ter multiplas solucoes validas).
 *
 * Nao altera o estado do chess.js recebido (faz move + undo internamente).
 *
 * @returns {{
 *   status: 'correct'|'wrong'|'illegal',
 *   move: object|null,
 *   expected: string,
 *   message: string
 * }}
 */
export function validateMove(chess, from, to, promotion, expected) {
  if (!expected || expected.length === 0) {
    return { status: 'illegal', move: null, expected: '', message: 'Exercicio invalido.' }
  }

  const played = normalizeUci(chess, from, to, promotion)

  // Tenta fazer o lance para saber se e legal.
  // Se for promocao e o usuario nao passou a peca, usa 'q' por default
  // (chess.js exige a peca quando peao chega na ultima fileira).
  let move
  try {
    const input = { from, to }
    if (promotion) {
      input.promotion = promotion
    } else {
      const piece = chess.get(from)
      if (piece?.type === 'p') {
        const lastRank = piece.color === 'w' ? '8' : '1'
        if (to[1] === lastRank) input.promotion = 'q'
      }
    }
    move = chess.move(input)
  } catch {
    move = null
  }

  if (!move) {
    return {
      status: 'illegal',
      move: null,
      expected: expected[0],
      message: 'Lance ilegal. Tente outra casa.',
    }
  }

  // Desfaz: a validacao nao deve alterar o board real
  chess.undo()

  const normalizedExpected = expected.map((u) => u.toLowerCase())

  if (normalizedExpected.includes(played)) {
    return {
      status: 'correct',
      move,
      expected: expected[0],
      message: '',
    }
  }

  return {
    status: 'wrong',
    move,
    expected: expected[0],
    message: 'Esse lance e legal, mas nao e a solucao.',
  }
}


/**
 * Devolve o FEN imediatamente apos um lance, sem alterar o chess recebido.
 */
export function fenAfterMove(chess, from, to, promotion) {
  const fenBackup = chess.fen()
  try {
    const input = { from, to }
    if (promotion) input.promotion = promotion
    const moved = chess.move(input)
    if (!moved) {
      chess.load(fenBackup)
      return null
    }
    const result = chess.fen()
    chess.undo()
    return result
  } catch {
    chess.load(fenBackup)
    return null
  }
}


/**
 * Calcula os destinos possiveis a partir de um FEN para o Chessground.
 * Retorna Map<from, to[]>.
 */
export function buildDests(fen) {
  const chess = new Chess(fen)
  const dests = new Map()
  for (const move of chess.moves({ verbose: true })) {
    const list = dests.get(move.from)
    if (list) list.push(move.to)
    else dests.set(move.from, [move.to])
  }
  return dests
}


/**
 * Devolve a cor do jogador da vez no FEN ('w' ou 'b').
 */
export function turnFromFen(fen) {
  const parts = fen.split(' ')
  return parts[1] || 'w'
}
