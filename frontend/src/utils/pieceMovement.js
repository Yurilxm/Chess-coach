const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
const KNIGHT_OFFSETS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
const KING_OFFSETS = [...ROOK_DIRS, ...BISHOP_DIRS]

function toSquare(file, rank) {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
  return FILES[file] + (rank + 1)
}

function fromSquare(square) {
  return { file: FILES.indexOf(square[0]), rank: parseInt(square[1], 10) - 1 }
}

/**
 * Calcula, para CADA peça do tabuleiro, as casas que ela pode alcançar
 * respeitando o formato de movimento (cavalo em L, bispo na diagonal,
 * torre/dama em linha reta, bloqueio por outras peças) — mas SEM levar
 * em conta de quem é a vez ou se o rei fica em xeque. Isso é proposital:
 * o Editor existe para montar posições livremente, não para jogar uma
 * partida válida.
 *
 * @param {Array<Array<{type:string,color:string}|null>>} board - retorno de chess.board()
 * @returns {Map<string, string[]>}
 */
export function computeEditorDests(board) {
  // board[0] = 8ª fileira ... board[7] = 1ª fileira (convenção do chess.js)
  const grid = {}
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) return
      const rank = 7 - rowIndex
      grid[toSquare(colIndex, rank)] = cell
    })
  })

  const dests = new Map()
  for (const square of Object.keys(grid)) {
    const targets = computePieceDests(square, grid[square], grid)
    if (targets.length > 0) dests.set(square, targets)
  }
  return dests
}

function computePieceDests(square, piece, grid) {
  const { file, rank } = fromSquare(square)
  const targets = []

  const slide = (directions) => {
    for (const [df, dr] of directions) {
      let f = file + df
      let r = rank + dr
      while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
        const dest = toSquare(f, r)
        targets.push(dest)
        if (grid[dest]) break // bloqueado: pode "capturar" a peça, mas não passar dela
        f += df
        r += dr
      }
    }
  }

  const step = (offsets) => {
    for (const [df, dr] of offsets) {
      const dest = toSquare(file + df, rank + dr)
      if (dest) targets.push(dest)
    }
  }

  switch (piece.type) {
    case 'n':
      step(KNIGHT_OFFSETS)
      break
    case 'k':
      step(KING_OFFSETS)
      break
    case 'r':
      slide(ROOK_DIRS)
      break
    case 'b':
      slide(BISHOP_DIRS)
      break
    case 'q':
      slide(KING_OFFSETS)
      break
    case 'p': {
      const dir = piece.color === 'w' ? 1 : -1
      const startRank = piece.color === 'w' ? 1 : 6
      const oneStep = toSquare(file, rank + dir)
      if (oneStep && !grid[oneStep]) {
        targets.push(oneStep)
        const twoStep = toSquare(file, rank + dir * 2)
        if (rank === startRank && twoStep && !grid[twoStep]) targets.push(twoStep)
      }
      for (const df of [-1, 1]) {
        const diag = toSquare(file + df, rank + dir)
        if (diag && grid[diag]) targets.push(diag)
      }
      break
    }
    default:
      break
  }

  return targets
}