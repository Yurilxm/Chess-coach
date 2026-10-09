import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChessEditor } from './useChessEditor'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const KINGS_ONLY = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'


describe('useChessEditor — placePiece', () => {
  it('adiciona peca em casa vazia', () => {
    const { result } = renderHook(() => useChessEditor(KINGS_ONLY))

    act(() => {
      result.current.placePiece('d4', 'q', 'w')
    })

    expect(result.current.fen).not.toBe(KINGS_ONLY)
    expect(result.current.canUndo).toBe(true)
  })

  it('substitui peca existente', () => {
    const { result } = renderHook(() => useChessEditor(START_FEN))

    act(() => {
      result.current.placePiece('e2', 'q', 'b')
    })

    // FEN mudou: peao branco em e2 virou dama preta
    expect(result.current.fen).not.toBe(START_FEN)
  })
})


describe('useChessEditor — removePiece', () => {
  it('remove peca existente', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.removePiece('e2')
    })

    expect(result.current.fen).not.toBe(START_FEN)
  })

  it('remove em casa vazia nao quebra', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.removePiece('e4')
    })

    // Nada mudou visualmente (e4 estava vazia)
    expect(result.current.fen).toBe(START_FEN)
  })
})


describe('useChessEditor — setSideToMove', () => {
  it('muda turno para pretas', () => {
    const { result } = renderHook(() => useChessEditor())

    expect(result.current.turn).toBe('w')

    act(() => {
      result.current.setSideToMove('b')
    })

    expect(result.current.turn).toBe('b')
  })

  it('mudar para mesma cor nao quebra', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.setSideToMove('w')
    })

    expect(result.current.turn).toBe('w')
  })
})


describe('useChessEditor — undo', () => {
  it('desfaz multiplas vezes', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e2', 'e4')
      result.current.movePiece('d2', 'd4')
    })

    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.undo()
    })
    const fen1 = result.current.fen

    act(() => {
      result.current.undo()
    })

    expect(result.current.fen).not.toBe(fen1)
    expect(result.current.fen).toBe(START_FEN)
  })

  it('undo apos reset funciona', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e2', 'e4')
      result.current.reset()
    })

    expect(result.current.fen).toBe(START_FEN)

    act(() => {
      result.current.undo()
    })

    // Deve ter desfeito o reset (voltando a posicao com e4 jogado)
    expect(result.current.fen).not.toBe(START_FEN)
  })
})


describe('useChessEditor — reset', () => {
  it('reset com FEN customizado', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.reset(KINGS_ONLY)
    })

    expect(result.current.fen).toBe(KINGS_ONLY)
  })
})


describe('useChessEditor — loadFen', () => {
  it('ignora FEN igual ao atual', () => {
    const { result } = renderHook(() => useChessEditor())

    const historicoAntes = result.current.canUndo

    act(() => {
      result.current.loadFen(START_FEN)
    })

    // Nao deve ter empilhado historico, pois nao mudou nada
    expect(result.current.canUndo).toBe(historicoAntes)
  })
})


describe('useChessEditor — movePiece', () => {
  it('nao move peca de casa vazia', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e4', 'e5')
    })

    expect(result.current.fen).toBe(START_FEN)
    expect(result.current.canUndo).toBe(false)
  })

  it('move peca da cor oposta (editor ignora turno)', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e7', 'e5')
    })

    expect(result.current.fen).not.toBe(START_FEN)
  })

  it('nao valida regras de xadrez (peao pode andar 3 casas)', () => {
    const { result } = renderHook(() => useChessEditor())

    // movePiece move a peca "brutalmente" para a casa de destino
    act(() => {
      result.current.movePiece('e2', 'e5')
    })

    // FEN mudou, mesmo sendo um lance invalido no xadrez real
    expect(result.current.fen).not.toBe(START_FEN)
  })
})
