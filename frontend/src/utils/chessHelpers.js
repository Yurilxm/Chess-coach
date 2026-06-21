import { Chess } from 'chess.js'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

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

function squareToCoords(square) {
  return { file: FILES.indexOf(square[0]), rank: parseInt(square[1], 10) - 1 }
}

function coordsToSquare(file, rank) {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
  return FILES[file] + (rank + 1)
}

const SLIDING_DIRECTIONS = {
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  q: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
}

const KNIGHT_OFFSETS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
const KING_OFFSETS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]

/**
 * Calcula os destinos possíveis de cada peça no Modo Editor, respeitando o
 * padrão de movimento de cada tipo de peça (cavalo em L, torre em linha,
 * bispo na diagonal...) e bloqueio por outras peças no caminho. Diferente
 * de buildDests(), ignora de quem é a vez e regras de xeque — afinal, no
 * editor você pode mover qualquer peça, de qualquer cor, a qualquer momento.
 */
export function computeEditorDests(chess) {
  const dests = new Map()

  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const square = coordsToSquare(file, rank)
      const piece = chess.get(square)
      if (!piece) continue

      const targets = []

      if (piece.type === 'n') {
        for (const [df, dr] of KNIGHT_OFFSETS) {
          const dest = coordsToSquare(file + df, rank + dr)
          if (dest) targets.push(dest)
        }
      } else if (piece.type === 'k') {
        for (const [df, dr] of KING_OFFSETS) {
          const dest = coordsToSquare(file + df, rank + dr)
          if (dest) targets.push(dest)
        }
      } else if (piece.type === 'p') {
        const dir = piece.color === 'w' ? 1 : -1
        const startRank = piece.color === 'w' ? 1 : 6

        const oneStep = coordsToSquare(file, rank + dir)
        if (oneStep && !chess.get(oneStep)) {
          targets.push(oneStep)
          if (rank === startRank) {
            const twoStep = coordsToSquare(file, rank + dir * 2)
            if (twoStep && !chess.get(twoStep)) targets.push(twoStep)
          }
        }
        for (const df of [-1, 1]) {
          const diag = coordsToSquare(file + df, rank + dir)
          if (diag && chess.get(diag)) targets.push(diag)
        }
      } else {
        const directions = SLIDING_DIRECTIONS[piece.type]
        if (directions) {
          for (const [df, dr] of directions) {
            let f = file + df
            let r = rank + dr
            while (true) {
              const dest = coordsToSquare(f, r)
              if (!dest) break
              targets.push(dest)
              if (chess.get(dest)) break // bloqueado: peça pode capturar, mas não passa por cima
              f += df
              r += dr
            }
          }
        }
      }

      if (targets.length > 0) dests.set(square, targets)
    }
  }

  return dests
}

/**
 * A partir do histórico verbose do chess.js, devolve as peças capturadas
 * de cada cor. Quem captura é o lance.color; a peça capturada é da cor
 * oposta a quem fez o lance.
 * 
 * @param {Array} history - chess.history({ verbose: true })
 * @returns {{ byWhite: string[], byBlack: string[] }}
 */
export function getCapturedPieces(history) {
  const byWhite = [] // peças pretas capturadas pelas brancas
  const byBlack = [] // peças brancas capturadas pelas pretas
  
  for (const move of history || []) {
    if (!move.captured) continue
    
    if (move.color === 'w') {
      byWhite.push(move.captured) // brancas capturaram uma peça preta
    } else {
      byBlack.push(move.captured) // pretas capturaram uma peça branca
    }
  }
  
  return { byWhite, byBlack }
}

export const PIECE_SYMBOLS_BY_COLOR = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
}