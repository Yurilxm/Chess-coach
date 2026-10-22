import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAcademy } from './useAcademy'


describe('useAcademy', () => {
  it('carrega todas as licoes disponiveis', () => {
    const { result } = renderHook(() => useAcademy())
    expect(result.current.lessons.length).toBeGreaterThanOrEqual(2)
  })

  it('getLessonById encontra licao existente', () => {
    const { result } = renderHook(() => useAcademy())
    const lesson = result.current.getLessonById('movimento-peao')
    expect(lesson).not.toBeNull()
    expect(lesson.title).toContain('peão')
  })

  it('getLessonById devolve null para id inexistente', () => {
    const { result } = renderHook(() => useAcademy())
    expect(result.current.getLessonById('nao-existe')).toBeNull()
  })

  it('expõe categories sem duplicatas', () => {
    const { result } = renderHook(() => useAcademy())
    const cats = result.current.categories
    expect(new Set(cats).size).toBe(cats.length)
  })

  it('expõe levels sem duplicatas', () => {
    const { result } = renderHook(() => useAcademy())
    const levels = result.current.levels
    expect(new Set(levels).size).toBe(levels.length)
  })

  it('filterLessons por level', () => {
    const { result } = renderHook(() => useAcademy())
    const filtered = result.current.filterLessons({ level: 'beginner' })
    expect(filtered.length).toBeGreaterThan(0)
    filtered.forEach((l) => expect(l.level).toBe('beginner'))
  })

  it('filterLessons por category', () => {
    const { result } = renderHook(() => useAcademy())
    const filtered = result.current.filterLessons({ category: 'taticas' })
    filtered.forEach((l) => expect(l.category).toBe('taticas'))
  })

  it('filterLessons por search', () => {
    const { result } = renderHook(() => useAcademy())
    const filtered = result.current.filterLessons({ search: 'peão' })
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('filterLessons sem filtro devolve todas', () => {
    const { result } = renderHook(() => useAcademy())
    expect(result.current.filterLessons({}).length).toBe(result.current.lessons.length)
  })
})
