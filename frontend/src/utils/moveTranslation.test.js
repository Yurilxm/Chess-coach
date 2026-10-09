import { describe, it, expect } from 'vitest'
import {
  pieceNamePt, describeMoveObject, describeUciMove,
  explainMoveHeuristic, getOptionInsight,
} from './moveTranslation'

describe('pieceNamePt', () => {
  it('nomes basicos em PT', () => {
    expect(pieceNamePt('p')).toBe('Peão')
    expect(pieceNamePt('n')).toBe('Cavalo')
    expect(pieceNamePt('b')).toBe('Bispo')
    expect(pieceNamePt('r')).toBe('Torre')
    expect(pieceNamePt('q')).toBe('Dama')
    expect(pieceNamePt('k')).toBe('Rei')
  })
  it('tipo desconhecido vira Peca', () => {
    expect(pieceNamePt('x')).toBe('Peça')
  })
})

describe('describeMoveObject', () => {
  it('retorna string vazia para move nulo', () => {
    expect(describeMoveObject(null)).toBe('')
  })
  it('detecta roque pequeno', () => {
    expect(describeMoveObject({ san: 'O-O' })).toContain('Roque pequeno')
  })
  it('detecta roque grande', () => {
    expect(describeMoveObject({ san: 'O-O-O' })).toContain('Roque grande')
  })
  it('descreve lance simples', () => {
    const m = { san: 'e4', piece: 'p', from: 'e2', to: 'e4' }
    expect(describeMoveObject(m)).toContain('Peão')
    expect(describeMoveObject(m)).toContain('e2')
    expect(describeMoveObject(m)).toContain('e4')
  })
  it('descreve captura', () => {
    const m = { san: 'Qxf7', piece: 'q', from: 'h5', to: 'f7', captured: 'p' }
    const desc = describeMoveObject(m)
    expect(desc).toContain('Dama')
    expect(desc).toContain('peão')
  })
})

describe('describeUciMove', () => {
  it('retorna null para fen ausente', () => {
    expect(describeUciMove('', 'e2e4')).toBeNull()
  })
  it('retorna null para uci curto', () => {
    expect(describeUciMove('rnbq', 'e2')).toBeNull()
  })
  it('descreve lance valido na posicao inicial', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const r = describeUciMove(fen, 'e2e4')
    expect(r).not.toBeNull()
    expect(r.from).toBe('e2')
    expect(r.to).toBe('e4')
    expect(r.piece).toBe('p')
  })
  it('retorna null para lance ilegal', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(describeUciMove(fen, 'a1a8')).toBeNull()
  })
})

describe('explainMoveHeuristic', () => {
  it('retorna string vazia para null', () => {
    expect(explainMoveHeuristic(null)).toBe('')
  })
  it('roque tem frase especifica', () => {
    expect(explainMoveHeuristic({ san: 'O-O' })).toContain('segura')
  })
  it('xeque-mate tem frase especifica', () => {
    const info = { san: 'Qh5#', piece: 'q', from: 'd1', to: 'h5' }
    expect(explainMoveHeuristic(info)).toContain('xeque-mate')
  })
  it('xeque simples tem frase especifica', () => {
    const info = { san: 'Qh5+', piece: 'q', from: 'd1', to: 'h5' }
    expect(explainMoveHeuristic(info)).toContain('xeque')
  })
  it('lance para o centro menciona controle', () => {
    const info = { san: 'e4', piece: 'p', from: 'e2', to: 'e4' }
    expect(explainMoveHeuristic(info)).toContain('centro')
  })
})

describe('getOptionInsight', () => {
  it('indice 0 retorna Melhor lance', () => {
    expect(getOptionInsight(0).label).toBe('Melhor lance')
  })
  it('indice 1 retorna Segunda opcao', () => {
    expect(getOptionInsight(1).label).toBe('Segunda opção')
  })
  it('indice 2 retorna Terceira opcao', () => {
    expect(getOptionInsight(2).label).toBe('Terceira opção')
  })
  it('indice fora do range retorna a ultima opcao', () => {
    expect(getOptionInsight(99).label).toBe('Terceira opção')
  })
})
