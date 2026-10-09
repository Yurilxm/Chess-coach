import { describe, it, expect } from 'vitest'
import {
  START_FEN, EMPTY_FEN,
  colorName, createChess, buildDests, needsPromotion,
  computeEditorDests, applyVirtualMove, getCapturedPieces,
  PIECE_SYMBOLS_BY_COLOR,
} from './chessHelpers'

describe('constantes', () => {
  it('START_FEN e o FEN da posicao inicial', () => {
    expect(START_FEN).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  })
  it('EMPTY_FEN e um tabuleiro vazio', () => {
    expect(EMPTY_FEN).toBe('8/8/8/8/8/8/8/8 w - - 0 1')
  })
})

describe('colorName', () => {
  it('mapeia w para white', () => {
    expect(colorName('w')).toBe('white')
  })
  it('mapeia b para black', () => {
    expect(colorName('b')).toBe('black')
  })
  it('qualquer outro valor vira black', () => {
    expect(colorName('x')).toBe('black')
  })
})

describe('createChess', () => {
  it('cria uma instancia com FEN default quando nada e passado', () => {
    const chess = createChess()
    expect(chess.fen()).toBe(START_FEN)
  })
  it('cria uma instancia com FEN customizado', () => {
    // chess.js v1.x rejeita FEN sem rei. Usamos FEN minimo valido.
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'
    const chess = createChess(fen)
    expect(chess.fen()).toBe(fen)
  })
})

describe('buildDests', () => {
  it('retorna 20 destinos na posicao inicial', () => {
    const chess = createChess()
    const dests = buildDests(chess)
    let total = 0
    for (const targets of dests.values()) total += targets.length
    expect(total).toBe(20)
  })
  it('peao e2 pode ir para e3 ou e4', () => {
    const chess = createChess()
    const dests = buildDests(chess)
    expect(dests.get('e2').sort()).toEqual(['e3', 'e4'])
  })
  it('cavalo g1 pode ir para f3 ou h3', () => {
    const chess = createChess()
    const dests = buildDests(chess)
    expect(dests.get('g1').sort()).toEqual(['f3', 'h3'])
  })
})

describe('needsPromotion', () => {
  it('detecta promocao do peao branco na oitava', () => {
    const chess = createChess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
    expect(needsPromotion(chess, 'a7', 'a8')).toBe(true)
  })
  it('nao detecta promocao em lance normal', () => {
    const chess = createChess()
    expect(needsPromotion(chess, 'e2', 'e4')).toBe(false)
  })
  it('retorna false para peca nao-peao', () => {
    const chess = createChess()
    expect(needsPromotion(chess, 'g1', 'f3')).toBe(false)
  })
  it('retorna false para square vazio', () => {
    const chess = createChess()
    expect(needsPromotion(chess, 'e4', 'e5')).toBe(false)
  })
})

describe('computeEditorDests (via chess instance)', () => {
  it('retorna destinos para as 32 pecas na posicao inicial', () => {
    const chess = createChess()
    const dests = computeEditorDests(chess)
    // 16 pecas brancas + 16 pecas pretas = 32 entradas
    expect(dests.size).toBe(32)
  })
  it('ignora turno — peca preta tambem tem destinos', () => {
    const chess = createChess()
    const dests = computeEditorDests(chess)
    expect(dests.has('e7')).toBe(true)
  })
  it('peao branco em e2 pode ir para e3 ou e4', () => {
    const chess = createChess()
    const dests = computeEditorDests(chess)
    expect(dests.get('e2').sort()).toEqual(['e3', 'e4'])
  })
})

describe('applyVirtualMove', () => {
  it('move uma peca sem validar regras', () => {
    const chess = createChess()
    applyVirtualMove(chess, 'e2', 'e4', null)
    expect(chess.get('e2')).toBeUndefined()
    expect(chess.get('e4').type).toBe('p')
  })
  it('captura peca adversaria se houver', () => {
    const chess = createChess('4k3/8/8/8/4p3/4P3/8/4K3 w - - 0 1')
    applyVirtualMove(chess, 'e3', 'e4', null)
    expect(chess.get('e4').color).toBe('w')
  })
  it('promove peao quando atinge ultima fileira', () => {
    const chess = createChess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
    applyVirtualMove(chess, 'a7', 'a8', 'q')
    expect(chess.get('a8').type).toBe('q')
  })
  it('retorna false se origem vazia', () => {
    const chess = createChess()
    expect(applyVirtualMove(chess, 'e4', 'e5', null)).toBe(false)
  })
})

describe('getCapturedPieces', () => {
  it('lista vazia quando sem capturas', () => {
    const r = getCapturedPieces([])
    expect(r.byWhite).toEqual([])
    expect(r.byBlack).toEqual([])
  })
  it('captura das brancas aparece em byWhite', () => {
    const r = getCapturedPieces([{ color: 'w', captured: 'p' }])
    expect(r.byWhite).toEqual(['p'])
    expect(r.byBlack).toEqual([])
  })
  it('captura das pretas aparece em byBlack', () => {
    const r = getCapturedPieces([{ color: 'b', captured: 'n' }])
    expect(r.byWhite).toEqual([])
    expect(r.byBlack).toEqual(['n'])
  })
  it('ignora lances sem captura', () => {
    const r = getCapturedPieces([
      { color: 'w' },
      { color: 'w', captured: 'p' },
      { color: 'b' },
    ])
    expect(r.byWhite).toEqual(['p'])
    expect(r.byBlack).toEqual([])
  })
})

describe('PIECE_SYMBOLS_BY_COLOR', () => {
  it('tem simbolos para todas as 6 pecas em ambas as cores', () => {
    for (const color of ['w', 'b']) {
      for (const piece of ['p', 'n', 'b', 'r', 'q', 'k']) {
        expect(PIECE_SYMBOLS_BY_COLOR[color][piece]).toBeTruthy()
      }
    }
  })
})
