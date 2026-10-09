import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { computeEditorDests } from './pieceMovement'

function boardFromFen(fen) {
  const chess = new Chess(fen)
  return chess.board()
}

describe('computeEditorDests (via board matrix)', () => {
  it('retorna destinos para as 20 pecas com movimento na posicao inicial', () => {
    const board = boardFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const dests = computeEditorDests(board)
    // Na posicao inicial, so peoes (16) e cavalos (4) tem destino.
    // Torres, bispos, damas e reis estao bloqueados por pecas proprias.
    expect(dests.size).toBe(20)
  })
  it('peao branco em e2 pode ir para e3 e e4', () => {
    const board = boardFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const dests = computeEditorDests(board)
    expect(dests.get('e2').sort()).toEqual(['e3', 'e4'])
  })
  it('peao preto em e7 pode ir para e6 e e5 (editor ignora turno)', () => {
    const board = boardFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const dests = computeEditorDests(board)
    expect(dests.get('e7').sort()).toEqual(['e5', 'e6'])
  })
  it('cavalo em g1 nao inclui e2 (peca propria)', () => {
    const board = boardFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const dests = computeEditorDests(board)
    // e2 tem peao branco (mesma cor) — nao pode ser destino
    expect(dests.get('g1').sort()).toEqual(['f3', 'h3'])
  })
  it('torre bloqueada por peao proprio nao tem destino nenhum', () => {
    const board = boardFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const dests = computeEditorDests(board)
    // Torre a1 esta bloqueada por a2 (peao proprio) e b1 (cavalo proprio).
    // Como nenhum destino e valido, a1 nem entra no Map.
    expect(dests.get('a1')).toBeUndefined()
  })

  it('torre livre tem destinos ate a borda', () => {
    const board = boardFromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1')
    const dests = computeEditorDests(board)
    const a1 = dests.get('a1')
    expect(a1).toBeDefined()
    // Coluna a (a2..a8) + fileira 1 ate antes do rei em e1.
    // sort() porque a ordem de iteracao interna das direcoes pode mudar.
    expect([...a1].sort()).toEqual(['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'b1', 'c1', 'd1'])
  })
  it('retorna Map vazio em tabuleiro apenas com reis', () => {
    const board = boardFromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    const dests = computeEditorDests(board)
    // So 2 reis, cada um com destinos. Nao e vazio, mas nao tem 32.
    expect(dests.size).toBe(2)
  })
})
