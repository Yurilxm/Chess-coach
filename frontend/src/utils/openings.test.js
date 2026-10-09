import { describe, it, expect } from 'vitest'
import { detectOpening } from './openings'

function _mv(from, to) {
  return { from, to }
}

describe('detectOpening', () => {
  it('retorna null para historico vazio', () => {
    expect(detectOpening([])).toBeNull()
  })
  it('retorna null para historico nulo', () => {
    expect(detectOpening(null)).toBeNull()
  })
  it('detecta Bird (unico lance f2f4)', () => {
    const r = detectOpening([_mv('f2', 'f4')])
    expect(r).not.toBeNull()
    expect(r.code).toBe('A00')
  })
  it('detecta Italiana (C50)', () => {
    const h = [
      _mv('e2', 'e4'), _mv('e7', 'e5'),
      _mv('g1', 'f3'), _mv('b8', 'c6'),
      _mv('f1', 'c4'),
    ]
    const r = detectOpening(h)
    expect(r).not.toBeNull()
    expect(r.code).toBe('C50')
    expect(r.name).toContain('Italiana')
  })
  it('detecta Ruy Lopez (C60)', () => {
    const h = [
      _mv('e2', 'e4'), _mv('e7', 'e5'),
      _mv('g1', 'f3'), _mv('b8', 'c6'),
      _mv('f1', 'b5'),
    ]
    const r = detectOpening(h)
    expect(r).not.toBeNull()
    expect(r.code).toBe('C60')
    expect(r.name).toContain('Ruy')
  })
  it('detecta Siciliana (B20)', () => {
    const h = [_mv('e2', 'e4'), _mv('c7', 'c5')]
    const r = detectOpening(h)
    expect(r).not.toBeNull()
    expect(r.code).toBe('B20')
  })
  it('retorna null quando nenhuma abertura casa', () => {
    const h = [_mv('a2', 'a3'), _mv('a7', 'a6')]
    expect(detectOpening(h)).toBeNull()
  })
  it('escolhe a mais especifica em caso de match multiplo', () => {
    const h = [
      _mv('e2', 'e4'), _mv('e7', 'e5'),
      _mv('g1', 'f3'), _mv('b8', 'c6'),
      _mv('f1', 'c4'), _mv('f8', 'c5'),
      _mv('d2', 'd3'),
    ]
    const r = detectOpening(h)
    expect(r.code).toBe('C54')
  })
})
