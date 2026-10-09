import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChessEditor } from './useChessEditor'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'


describe('useChessEditor - estado inicial', () => {
  it('comeca na posicao inicial', () => {
    const { result } = renderHook(() => useChessEditor())
    expect(result.current.fen).toBe(START_FEN)
    expect(result.current.canUndo).toBe(false)
  })

  it('aceita FEN customizado', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'
    const { result } = renderHook(() => useChessEditor(fen))
    expect(result.current.fen).toBe(fen)
  })
})


describe('useChessEditor - movePiece', () => {
  it('move peca branca livremente', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e2', 'e4')
    })

    expect(result.current.canUndo).toBe(true)
    // O FEN deve ter mudado
    expect(result.current.fen).not.toBe(START_FEN)
  })

  it('move peca preta (sem respeitar turno)', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e7', 'e5')
    })

    // Mudou o FEN mesmo com a vez das brancas
    expect(result.current.fen).not.toBe(START_FEN)
  })

  it('ignora square vazio', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e4', 'e5')
    })

    // Nada aconteceu
    expect(result.current.fen).toBe(START_FEN)
    expect(result.current.canUndo).toBe(false)
  })
})


describe('useChessEditor - placePiece e removePiece', () => {
  it('placePiece adiciona peca em casa vazia', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'
    const { result } = renderHook(() => useChessEditor(fen))

    act(() => {
      result.current.placePiece('d4', 'q', 'w')
    })

    expect(result.current.fen).not.toBe(fen)
    expect(result.current.canUndo).toBe(true)
  })

  it('removePiece remove peca existente', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.removePiece('e2')
    })

    expect(result.current.fen).not.toBe(START_FEN)
  })
})


describe('useChessEditor - setSideToMove', () => {
  it('muda o lado a jogar', () => {
    const { result } = renderHook(() => useChessEditor())

    expect(result.current.turn).toBe('w')

    act(() => {
      result.current.setSideToMove('b')
    })

    expect(result.current.turn).toBe('b')
  })
})


describe('useChessEditor - undo', () => {
  it('undo desfaz a ultima alteracao', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e2', 'e4')
    })
    const aposMovimento = result.current.fen

    act(() => {
      result.current.undo()
    })

    expect(result.current.fen).toBe(START_FEN)
    expect(result.current.fen).not.toBe(aposMovimento)
  })

  it('undo em historico vazio retorna false', () => {
    const { result } = renderHook(() => useChessEditor())

    let retorno
    act(() => {
      retorno = result.current.undo()
    })

    expect(retorno).toBe(false)
  })
})


describe('useChessEditor - reset', () => {
  it('reset volta para a posicao inicial', () => {
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.movePiece('e2', 'e4')
    })
    expect(result.current.fen).not.toBe(START_FEN)

    act(() => {
      result.current.reset()
    })

    expect(result.current.fen).toBe(START_FEN)
  })
})


describe('useChessEditor - loadFen', () => {
  it('carrega nova posicao', () => {
    const { result } = renderHook(() => useChessEditor())
    const novaFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'

    act(() => {
      result.current.loadFen(novaFen)
    })

    expect(result.current.fen).toBe(novaFen)
  })

  it('loadFen rejeita FEN invalido sem alterar o board', () => {
    // Apos fix: validateFen() rejeita strings malformadas antes do load.
    const { result } = renderHook(() => useChessEditor())

    act(() => {
      result.current.loadFen('isso nao e FEN')
    })

    expect(result.current.fen).toBe(START_FEN)
  })
})
