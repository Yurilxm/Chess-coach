import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBoardTheme, THEMES } from './useBoardTheme'

const STORAGE_KEY = 'chess-coach:board-theme'

beforeEach(() => {
  localStorage.clear()
})

describe('useBoardTheme', () => {
  it('inicia com o tema brown por padrao', () => {
    const { result } = renderHook(() => useBoardTheme())
    expect(result.current.theme).toBe('brown')
  })

  it('expõe a lista de temas', () => {
    const { result } = renderHook(() => useBoardTheme())
    expect(result.current.themes).toEqual(THEMES)
    expect(result.current.themes.length).toBeGreaterThan(1)
  })

  it('muda o tema e salva no localStorage', () => {
    const { result } = renderHook(() => useBoardTheme())

    act(() => {
      result.current.setTheme('blue')
    })

    expect(result.current.theme).toBe('blue')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('blue')
  })

  it('recupera o tema salvo no localStorage ao iniciar', () => {
    localStorage.setItem(STORAGE_KEY, 'purple')
    const { result } = renderHook(() => useBoardTheme())
    expect(result.current.theme).toBe('purple')
  })
})
