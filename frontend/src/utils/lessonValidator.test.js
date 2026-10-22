import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import {
  applySetup,
  buildDests,
  fenAfterMove,
  turnFromFen,
  validateMove,
} from './lessonValidator'


const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'


describe('applySetup', () => {
  it('sem setup, devolve o mesmo FEN', () => {
    expect(applySetup(START_FEN, [])).toBe(START_FEN)
    expect(applySetup(START_FEN, null)).toBe(START_FEN)
  })

  it('aplica uma sequencia de moves', () => {
    const result = applySetup(START_FEN, ['e2e4', 'e7e5'])
    expect(result).not.toBe(START_FEN)
    // e4 e e5 ja estao jogados
    const chess = new Chess(result)
    expect(chess.turn()).toBe('w')
  })

  it('falha em lance ilegal, devolve FEN original', () => {
    const result = applySetup(START_FEN, ['a1a8'])
    expect(result).toBe(START_FEN)
  })

  it('aplica promocao', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const result = applySetup(fen, ['a7a8q'])
    expect(result).not.toBe(fen)
    const chess = new Chess(result)
    expect(chess.get('a8').type).toBe('q')
  })
})


describe('validateMove — status correto', () => {
  it('lance que casa com expected retorna correct', () => {
    const chess = new Chess(START_FEN)
    const result = validateMove(chess, 'e2', 'e4', undefined, ['e2e4'])
    expect(result.status).toBe('correct')
  })

  it('lance legal mas diferente retorna wrong', () => {
    const chess = new Chess(START_FEN)
    const result = validateMove(chess, 'd2', 'd4', undefined, ['e2e4'])
    expect(result.status).toBe('wrong')
  })

  it('lance ilegal retorna illegal', () => {
    const chess = new Chess(START_FEN)
    const result = validateMove(chess, 'e2', 'e5', undefined, ['e2e4'])
    expect(result.status).toBe('illegal')
  })

  it('expected vazio retorna illegal', () => {
    const chess = new Chess(START_FEN)
    const result = validateMove(chess, 'e2', 'e4', undefined, [])
    expect(result.status).toBe('illegal')
  })
})


describe('validateMove — multiplas solucoes', () => {
  it('aceita qualquer lance em expected', () => {
    const chess = new Chess(START_FEN)
    const result = validateMove(chess, 'd2', 'd4', undefined, ['e2e4', 'd2d4'])
    expect(result.status).toBe('correct')
  })
})


describe('validateMove — promocao', () => {
  it('promocao com q explicitada', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const chess = new Chess(fen)
    const result = validateMove(chess, 'a7', 'a8', 'q', ['a7a8q'])
    expect(result.status).toBe('correct')
  })

  it('promocao sem promo explicita, expected com q (default)', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const chess = new Chess(fen)
    const result = validateMove(chess, 'a7', 'a8', undefined, ['a7a8q'])
    expect(result.status).toBe('correct')
  })

  it('promocao para cavalo e reconhecida', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const chess = new Chess(fen)
    const result = validateMove(chess, 'a7', 'a8', 'n', ['a7a8n'])
    expect(result.status).toBe('correct')
  })
})


describe('validateMove — nao altera o chess', () => {
  it('devolve o chess ao estado original apos validar', () => {
    const chess = new Chess(START_FEN)
    const antes = chess.fen()
    validateMove(chess, 'e2', 'e4', undefined, ['e2e4'])
    expect(chess.fen()).toBe(antes)
  })
})


describe('buildDests', () => {
  it('peao e2 pode ir para e3 e e4', () => {
    const dests = buildDests(START_FEN)
    expect(dests.get('e2').sort()).toEqual(['e3', 'e4'])
  })

  it('retorna 20 destinos na posicao inicial', () => {
    const dests = buildDests(START_FEN)
    let total = 0
    for (const targets of dests.values()) total += targets.length
    expect(total).toBe(20)
  })
})


describe('fenAfterMove', () => {
  it('devolve FEN apos o lance', () => {
    const chess = new Chess(START_FEN)
    const fen = fenAfterMove(chess, 'e2', 'e4', undefined)
    expect(fen).not.toBe(START_FEN)
    expect(chess.fen()).toBe(START_FEN)  // chess original nao mudou
  })

  it('lance ilegal devolve null', () => {
    const chess = new Chess(START_FEN)
    expect(fenAfterMove(chess, 'e2', 'e5', undefined)).toBeNull()
  })
})


describe('turnFromFen', () => {
  it('brancas jogam em START_FEN', () => {
    expect(turnFromFen(START_FEN)).toBe('w')
  })

  it('pretas jogam em FEN pos-e4', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    expect(turnFromFen(fen)).toBe('b')
  })

  it('fallback para w em FEN invalido', () => {
    expect(turnFromFen('lixo')).toBe('w')
  })
})
