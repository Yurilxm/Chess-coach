import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChessGame } from './useChessGame'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// Posicao: so reis e peoes
const SIMPLE_FEN = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'
// Posicao: rei branco, rei preto, peao branco em e4, peao preto em d5
const CAPTURE_FEN = '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1'


describe('useChessGame — premove: fila', () => {
  it('addPremove adiciona item com promotion default', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e2', 'e4')
    })

    expect(result.current.premoveQueue.length).toBe(1)
    expect(result.current.premoveQueue[0]).toEqual({
      from: 'e2', to: 'e4', promotion: 'q'
    })
  })

  it('addPremove preserva promotion quando fornecido', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e7', 'e8', 'n')
    })

    expect(result.current.premoveQueue[0].promotion).toBe('n')
  })

  it('removeLastPremove em fila vazia nao quebra', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.removeLastPremove()
    })

    expect(result.current.premoveQueue).toEqual([])
  })

  it('clearPremoves limpa tudo', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e2', 'e4')
      result.current.addPremove('g1', 'f3')
      result.current.addPremove('f1', 'c4')
    })

    expect(result.current.premoveQueue.length).toBe(3)

    act(() => {
      result.current.clearPremoves()
    })

    expect(result.current.premoveQueue).toEqual([])
  })
})


describe('useChessGame — getPremoveDests', () => {
  it('retorna Map vazio sem playerColor', () => {
    const { result } = renderHook(() => useChessGame())

    let dests
    act(() => {
      dests = result.current.getPremoveDests()
    })

    expect(dests.size).toBe(0)
  })

  it('retorna destinos das pecas do jogador', () => {
    const { result } = renderHook(() => useChessGame(SIMPLE_FEN))

    act(() => {
      result.current.setPlayerColor('w')
    })

    const dests = result.current.getPremoveDests()

    // Rei em e1 + peao em e2 devem ter destinos
    expect(dests.has('e1')).toBe(true)
    expect(dests.has('e2')).toBe(true)
    // Rei preto em e8 nao entra (cor diferente do playerColor)
    expect(dests.has('e8')).toBe(false)
  })

  it('projeta posicao virtual considerando premove na fila', () => {
    const { result } = renderHook(() => useChessGame(START_FEN))

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('e2', 'e4')
    })

    const dests = result.current.getPremoveDests()

    // Depois da premove e2e4 projetada, o peao esta em e4
    // (nao mais em e2)
    expect(dests.has('e2')).toBe(false)
    expect(dests.has('e4')).toBe(true)
  })

  it('nao inclui pecas da cor oposta como destinos', () => {
    const { result } = renderHook(() => useChessGame(START_FEN))

    act(() => {
      result.current.setPlayerColor('w')
    })

    const dests = result.current.getPremoveDests()
    // Peoes pretos nao aparecem
    expect(dests.has('e7')).toBe(false)
    expect(dests.has('d7')).toBe(false)
  })
})


describe('useChessGame — executeNextPremove', () => {
  it('fila vazia retorna null', () => {
    const { result } = renderHook(() => useChessGame())

    let retorno
    act(() => {
      retorno = result.current.executeNextPremove()
    })

    expect(retorno).toBeNull()
  })

  it('executa premove legal e remove da fila', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('e2', 'e4')
    })

    let retorno
    act(() => {
      retorno = result.current.executeNextPremove()
    })

    expect(retorno).not.toBeNull()
    expect(retorno.move.san).toBe('e4')
    expect(result.current.premoveQueue).toEqual([])
    expect(result.current.history.length).toBe(1)
  })

  it('executa apenas a primeira premove quando ha varias na fila', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('e2', 'e4')
      result.current.addPremove('g1', 'f3')
    })

    act(() => {
      result.current.executeNextPremove()
    })

    // Fila agora tem so g1f3
    expect(result.current.premoveQueue.length).toBe(1)
    expect(result.current.premoveQueue[0].from).toBe('g1')
  })

  it('descarta fila quando a peca da vez nao e do jogador', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('e7', 'e5')  // peao preto
    })

    let retorno
    act(() => {
      retorno = result.current.executeNextPremove()
    })

    expect(retorno).toBeNull()
    // Fila descartada
    expect(result.current.premoveQueue).toEqual([])
  })

  it('descarta fila quando premove deixou de ser legal', () => {
    // Cenario: jogador tenta premove e2e4, mas o peao e2 nao existe mais
    const fen = '4k3/8/8/8/8/8/4P3/4K3 b - - 0 1'
    const { result } = renderHook(() => useChessGame(fen))

    act(() => {
      result.current.setPlayerColor('w')
      // adiciona premove que nao e legal (nao e a vez do jogador)
      result.current.addPremove('e1', 'f2')
    })

    act(() => {
      result.current.executeNextPremove()
    })

    // Fila descartada porque o lance nao e legal do ponto de vista da cor
    // de quem tem a vez
    expect(result.current.premoveQueue).toEqual([])
  })

  it('preserva promotion da premove ao executar', () => {
    // Peao branco em a7 pronto para promover
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const { result } = renderHook(() => useChessGame(fen))

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('a7', 'a8', 'n')
    })

    let retorno
    act(() => {
      retorno = result.current.executeNextPremove()
    })

    expect(retorno).not.toBeNull()
    expect(retorno.move.promotion).toBe('n')
  })
})


describe('useChessGame — premove com captura', () => {
  it('addPremove aceita captura', () => {
    const { result } = renderHook(() => useChessGame(CAPTURE_FEN))

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('e4', 'd5')
    })

    expect(result.current.premoveQueue.length).toBe(1)
  })

  it('executa captura quando lance e legal', () => {
    const { result } = renderHook(() => useChessGame(CAPTURE_FEN))

    act(() => {
      result.current.setPlayerColor('w')
      result.current.addPremove('e4', 'd5')
    })

    let retorno
    act(() => {
      retorno = result.current.executeNextPremove()
    })

    expect(retorno).not.toBeNull()
    expect(retorno.move.captured).toBe('p')
  })
})
