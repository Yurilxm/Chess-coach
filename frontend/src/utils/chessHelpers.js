import { Chess } from 'chess.js'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1'

export function colorName(c) {
  return c === 'w' ? 'white' : 'black'
}

export function createChess(fen) {
  return new Chess(fen || START_FEN)
}

export function buildDests(chess) {
  const dests = new Map()
  for (const move of chess.moves({ verbose: true })) {
    const list = dests.get(move.from)
    if (list) list.push(move.to)
    else dests.set(move.from, [move.to])
  }
  return dests
}

export function needsPromotion(chess, from, to) {
  const piece = chess.get(from)
  if (!piece || piece.type !== 'p') return false
  return (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1')
}