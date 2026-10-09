import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockfishAnalysis } from './useStockfishAnalysis'


describe('useStockfishAnalysis', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('comeca sem analysis e sem loading', () => {
    const { result } = renderHook(() => useStockfishAnalysis())
    expect(result.current.analysis).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('analyze faz POST com body correto', async () => {
    const fakeData = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      best_move: 'e2e4',
      evaluation: { type: 'cp', value: 30 },
      top_moves: ['e2e4'],
      lines: [],
      warnings: [],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeData,
    })

    const { result } = renderHook(() => useStockfishAnalysis())

    await act(async () => {
      await result.current.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    })

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url, options] = global.fetch.mock.calls[0]
    expect(url).toContain('/analyze')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body.fen).toContain('rnbqkbnr')
    expect(body.history).toBeUndefined()

    expect(result.current.analysis).toEqual(fakeData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('analyze inclui history no body quando fornecido', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ fen: '', best_move: '', evaluation: {}, top_moves: [], lines: [], warnings: [] }),
    })

    const { result } = renderHook(() => useStockfishAnalysis())

    await act(async () => {
      await result.current.analyze('algumfen', ['fen1', 'fen2'])
    })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.history).toEqual(['fen1', 'fen2'])
  })

  it('analyze com response nao-ok seta error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })

    const { result } = renderHook(() => useStockfishAnalysis())

    await act(async () => {
      await result.current.analyze('algumfen')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toContain('servidor local')
    expect(result.current.analysis).toBeNull()
  })

  it('analyze com fetch que lanca excecao seta error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useStockfishAnalysis())

    await act(async () => {
      await result.current.analyze('algumfen')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.loading).toBe(false)
  })

  it('analyze com fen vazio nao faz fetch', async () => {
    global.fetch = vi.fn()

    const { result } = renderHook(() => useStockfishAnalysis())

    await act(async () => {
      await result.current.analyze('')
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('clear reseta analysis e error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ fen: '', best_move: 'e2e4', evaluation: {}, top_moves: [], lines: [], warnings: [] }),
    })

    const { result } = renderHook(() => useStockfishAnalysis())

    await act(async () => {
      await result.current.analyze('algumfen')
    })
    expect(result.current.analysis).not.toBeNull()

    act(() => {
      result.current.clear()
    })

    expect(result.current.analysis).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
