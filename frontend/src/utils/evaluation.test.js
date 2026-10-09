import { describe, it, expect } from 'vitest'
import {
  formatEvalScore, evalToWhitePercent, evalDescriptionPt,
} from './evaluation'

describe('formatEvalScore', () => {
  it('retorna string vazia para evaluation nula', () => {
    expect(formatEvalScore(null)).toBe('')
  })
  it('formata mate positivo', () => {
    expect(formatEvalScore({ type: 'mate', value: 3 })).toBe('M3')
  })
  it('formata mate negativo com valor absoluto', () => {
    expect(formatEvalScore({ type: 'mate', value: -2 })).toBe('M2')
  })
  it('formata cp positivo com sinal +', () => {
    expect(formatEvalScore({ type: 'cp', value: 150 })).toBe('+1.5')
  })
  it('formata cp negativo sem sinal extra', () => {
    expect(formatEvalScore({ type: 'cp', value: -150 })).toBe('-1.5')
  })
  it('formata cp zero', () => {
    expect(formatEvalScore({ type: 'cp', value: 0 })).toBe('0.0')
  })
})

describe('evalToWhitePercent', () => {
  it('retorna 50 sem evaluation', () => {
    expect(evalToWhitePercent(null)).toBe(50)
  })
  it('retorna 97 para mate positivo', () => {
    expect(evalToWhitePercent({ type: 'mate', value: 3 })).toBe(97)
  })
  it('retorna 3 para mate negativo', () => {
    expect(evalToWhitePercent({ type: 'mate', value: -3 })).toBe(3)
  })
  it('cp 0 fica em 50%', () => {
    expect(evalToWhitePercent({ type: 'cp', value: 0 })).toBe(50)
  })
  it('cp 600 fica em 100%', () => {
    expect(evalToWhitePercent({ type: 'cp', value: 600 })).toBe(100)
  })
  it('cp acima de 600 e clampado em 100', () => {
    expect(evalToWhitePercent({ type: 'cp', value: 2000 })).toBe(100)
  })
  it('cp abaixo de -600 e clampado em 0', () => {
    expect(evalToWhitePercent({ type: 'cp', value: -2000 })).toBe(0)
  })
})

describe('evalDescriptionPt', () => {
  it('descricao inicial quando evaluation e nula', () => {
    expect(evalDescriptionPt(null)).toBe('Posição inicial')
  })
  it('mate das brancas', () => {
    expect(evalDescriptionPt({ type: 'mate', value: 3 })).toContain('brancas')
  })
  it('mate das pretas', () => {
    expect(evalDescriptionPt({ type: 'mate', value: -3 })).toContain('pretas')
  })
  it('cp 0 e equilibrio', () => {
    expect(evalDescriptionPt({ type: 'cp', value: 0 })).toBe('Posição equilibrada')
  })
  it('cp 400 e vencedora para brancas', () => {
    expect(evalDescriptionPt({ type: 'cp', value: 400 })).toContain('brancas')
  })
  it('cp -400 e vencedora para pretas', () => {
    expect(evalDescriptionPt({ type: 'cp', value: -400 })).toContain('pretas')
  })
})
