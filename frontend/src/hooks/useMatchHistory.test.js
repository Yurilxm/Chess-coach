import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMatchHistory } from './useMatchHistory'

const STORAGE_KEY = 'chess-coach:matches:v1'


// ---------------------------------------------------------------------------
// Fixture: review minimo valido
// ---------------------------------------------------------------------------

function fakeReview(overrides = {}) {
  return {
    result: 'Vitória',
    result_reason: 'Xeque-mate',
    stats: { accuracy: 85, total_moves: 40 },
    mistakes: [],
    all_moves: [],
    summary: 'Resumo teste',
    ...overrides,
  }
}

function fakeHistory() {
  return [
    { from: 'e2', to: 'e4', san: 'e4', color: 'w' },
    { from: 'e7', to: 'e5', san: 'e5', color: 'b' },
  ]
}


// ---------------------------------------------------------------------------
// Setup: limpa localStorage antes de cada teste
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})


// ---------------------------------------------------------------------------
// listMatches
// ---------------------------------------------------------------------------

describe('useMatchHistory — listMatches', () => {
  it('retorna lista vazia quando nada foi salvo', () => {
    const { result } = renderHook(() => useMatchHistory())
    expect(result.current.listMatches()).toEqual([])
  })

  it('retorna lista vazia quando o localStorage tem lixo', () => {
    localStorage.setItem(STORAGE_KEY, 'nao-e-json')
    const { result } = renderHook(() => useMatchHistory())
    expect(result.current.listMatches()).toEqual([])
  })

  it('retorna lista vazia quando o JSON nao e um array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
    const { result } = renderHook(() => useMatchHistory())
    expect(result.current.listMatches()).toEqual([])
  })
})


// ---------------------------------------------------------------------------
// saveMatch
// ---------------------------------------------------------------------------

describe('useMatchHistory — saveMatch', () => {
  it('salva uma partida com id e timestamp', () => {
    const { result } = renderHook(() => useMatchHistory())

    let entrada
    act(() => {
      entrada = result.current.saveMatch({
        playerColor: 'w',
        difficulty: 1000,
        review: fakeReview(),
        history: fakeHistory(),
      })
    })

    expect(entrada).not.toBeNull()
    expect(entrada.id).toBeTruthy()
    expect(entrada.savedAt).toBeTruthy()
    expect(entrada.schemaVersion).toBe(1)
    expect(entrada.playerColor).toBe('w')
    expect(entrada.difficulty).toBe(1000)
  })

  it('ignora saveMatch sem review', () => {
    const { result } = renderHook(() => useMatchHistory())

    let entrada
    act(() => {
      entrada = result.current.saveMatch({ playerColor: 'w' })
    })

    expect(entrada).toBeNull()
    expect(result.current.listMatches()).toEqual([])
  })

  it('ignora saveMatch com null', () => {
    const { result } = renderHook(() => useMatchHistory())

    let entrada
    act(() => {
      entrada = result.current.saveMatch(null)
    })

    expect(entrada).toBeNull()
  })

  it('copia somente campos relevantes do review', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.saveMatch({
        review: fakeReview({ campoExtra: 'ignorar' }),
        history: fakeHistory(),
      })
    })

    const salva = result.current.listMatches()[0]
    expect(salva.review).toHaveProperty('result')
    expect(salva.review).toHaveProperty('stats')
    expect(salva.review).toHaveProperty('all_moves')
    expect(salva.review).not.toHaveProperty('campoExtra')
  })

  it('preserva history enviado', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.saveMatch({
        review: fakeReview(),
        history: fakeHistory(),
      })
    })

    const salva = result.current.listMatches()[0]
    expect(salva.history.length).toBe(2)
    expect(salva.history[0].san).toBe('e4')
  })

  it('aceita history ausente (salva array vazio)', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.saveMatch({ review: fakeReview() })
    })

    const salva = result.current.listMatches()[0]
    expect(salva.history).toEqual([])
  })

  it('acumula varias partidas', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.saveMatch({ review: fakeReview(), history: [] })
    })
    act(() => {
      result.current.saveMatch({ review: fakeReview(), history: [] })
    })
    act(() => {
      result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    expect(result.current.listMatches().length).toBe(3)
  })

  it('ordena por savedAt (mais recente primeiro)', () => {
    const { result } = renderHook(() => useMatchHistory())

    // Injeta manualmente com timestamps conhecidos
    const antiga = {
      schemaVersion: 1, id: 'a', savedAt: '2024-01-01T00:00:00.000Z',
      review: fakeReview(), history: [],
    }
    const nova = {
      schemaVersion: 1, id: 'b', savedAt: '2024-06-01T00:00:00.000Z',
      review: fakeReview(), history: [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([antiga, nova]))

    const lista = result.current.listMatches()
    expect(lista[0].id).toBe('b')
    expect(lista[1].id).toBe('a')
  })

  it('mantem no maximo MAX_MATCHES partidas', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.saveMatch({ review: fakeReview(), history: [] })
      }
    })

    expect(result.current.listMatches().length).toBe(50)
  })

  it('descarta a partida mais antiga quando passa do limite', () => {
    const { result } = renderHook(() => useMatchHistory())

    // Salva 50 com timestamps distintos
    const base = Date.now()
    for (let i = 0; i < 50; i++) {
      const t = new Date(base + i * 1000).toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(
        (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).concat([{
          schemaVersion: 1, id: `id-${i}`, savedAt: t,
          review: fakeReview(), history: [],
        }])
      ))
    }

    // Adiciona mais uma
    act(() => {
      result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    const lista = result.current.listMatches()
    expect(lista.length).toBe(50)
    // id-0 deve ter sido descartado (mais antigo)
    expect(lista.find((m) => m.id === 'id-0')).toBeUndefined()
  })

  it('nao quebra se o localStorage estiver cheio', () => {
    const { result } = renderHook(() => useMatchHistory())

    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key) {
      if (key === STORAGE_KEY) throw new Error('QuotaExceededError')
      return originalSetItem.call(this, key)
    })

    let entrada
    act(() => {
      entrada = result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    // Retorna a entrada criada mesmo falhando ao salvar
    expect(entrada).not.toBeNull()
  })
})


// ---------------------------------------------------------------------------
// getMatch
// ---------------------------------------------------------------------------

describe('useMatchHistory — getMatch', () => {
  it('retorna a partida pelo id', () => {
    const { result } = renderHook(() => useMatchHistory())

    let entrada
    act(() => {
      entrada = result.current.saveMatch({ review: fakeReview(), history: fakeHistory() })
    })

    const achada = result.current.getMatch(entrada.id)
    expect(achada).not.toBeNull()
    expect(achada.id).toBe(entrada.id)
    expect(achada.history.length).toBe(2)
  })

  it('retorna null para id inexistente', () => {
    const { result } = renderHook(() => useMatchHistory())
    expect(result.current.getMatch('nao-existe')).toBeNull()
  })

  it('retorna null apos a partida ser deletada', () => {
    const { result } = renderHook(() => useMatchHistory())

    let entrada
    act(() => {
      entrada = result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    act(() => {
      result.current.deleteMatch(entrada.id)
    })

    expect(result.current.getMatch(entrada.id)).toBeNull()
  })
})


// ---------------------------------------------------------------------------
// deleteMatch
// ---------------------------------------------------------------------------

describe('useMatchHistory — deleteMatch', () => {
  it('remove uma partida especifica', () => {
    const { result } = renderHook(() => useMatchHistory())

    let a, b
    act(() => {
      a = result.current.saveMatch({ review: fakeReview(), history: [] })
      b = result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    let sucesso
    act(() => {
      sucesso = result.current.deleteMatch(a.id)
    })

    expect(sucesso).toBe(true)
    const lista = result.current.listMatches()
    expect(lista.length).toBe(1)
    expect(lista[0].id).toBe(b.id)
  })

  it('retorna false quando o id nao existe', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    let sucesso
    act(() => {
      sucesso = result.current.deleteMatch('nao-existe')
    })

    expect(sucesso).toBe(false)
    expect(result.current.listMatches().length).toBe(1)
  })
})


// ---------------------------------------------------------------------------
// clearAll
// ---------------------------------------------------------------------------

describe('useMatchHistory — clearAll', () => {
  it('apaga todas as partidas', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.saveMatch({ review: fakeReview(), history: [] })
      result.current.saveMatch({ review: fakeReview(), history: [] })
    })

    expect(result.current.listMatches().length).toBe(2)

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.listMatches()).toEqual([])
  })

  it('clearAll em lista vazia nao quebra', () => {
    const { result } = renderHook(() => useMatchHistory())

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.listMatches()).toEqual([])
  })
})


// ---------------------------------------------------------------------------
// Persistencia entre montagens (simula reabrir a pagina)
// ---------------------------------------------------------------------------

describe('useMatchHistory — persistencia', () => {
  it('dados sobrevivem a desmontar e montar de novo', () => {
    const primeiro = renderHook(() => useMatchHistory())

    act(() => {
      primeiro.result.current.saveMatch({
        playerColor: 'b', difficulty: 1600,
        review: fakeReview(), history: fakeHistory(),
      })
    })

    primeiro.unmount()

    // "Reabre a pagina"
    const segundo = renderHook(() => useMatchHistory())
    const lista = segundo.result.current.listMatches()

    expect(lista.length).toBe(1)
    expect(lista[0].playerColor).toBe('b')
    expect(lista[0].difficulty).toBe(1600)
  })
})


// ---------------------------------------------------------------------------
// MAX_MATCHES exposto
// ---------------------------------------------------------------------------

describe('useMatchHistory — constante', () => {
  it('MAX_MATCHES e 50', () => {
    const { result } = renderHook(() => useMatchHistory())
    expect(result.current.MAX_MATCHES).toBe(50)
  })
})
