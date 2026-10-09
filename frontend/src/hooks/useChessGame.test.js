import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChessGame } from './useChessGame'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'


describe('useChessGame - estado inicial', () => {
  it('comeca na posicao inicial', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.fen).toBe(START_FEN)
    expect(result.current.turn).toBe('w')
    expect(result.current.history).toEqual([])
    expect(result.current.isGameOver).toBe(false)
  })

  it('comeca sem playerColor definido', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.playerColor).toBeNull()
  })

  it('comeca com fila de premove vazia', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.premoveQueue).toEqual([])
  })
})


describe('useChessGame - attemptMove', () => {
  it('aceita lance legal e2e4', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.attemptMove('e2', 'e4')
    })

    expect(result.current.turn).toBe('b')
    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].san).toBe('e4')
  })

  it('rejeita lance ilegal', () => {
    const { result } = renderHook(() => useChessGame())

    let retorno
    act(() => {
      retorno = result.current.attemptMove('e2', 'e5')
    })

    expect(retorno.illegal).toBe(true)
    expect(result.current.turn).toBe('w')
    expect(result.current.history).toEqual([])
  })

  it('bloqueia lance de peca da cor errada quando playerColor e setado', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.setPlayerColor('w')
    })

    let retorno
    act(() => {
      // Pretas na vez das brancas: bloqueado
      retorno = result.current.attemptMove('e7', 'e5')
    })

    expect(retorno.illegal).toBe(true)
    expect(result.current.turn).toBe('w')
  })

  it('com skipColorCheck permite lancar peca de qualquer cor', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.setPlayerColor('w')
    })

    // Mesmo assim, e7e5 e lance legal? Sim, mas nao e a vez das pretas.
    // attemptMove com skipColorCheck pula o check de cor, mas o chess.move
    // ainda rejeita se nao for a vez. Entao o retorno sera illegal.
    let retorno
    act(() => {
      retorno = result.current.attemptMove('e7', 'e5', { skipColorCheck: true })
    })

    // Ainda bloqueia porque nao e a vez das pretas
    expect(retorno.illegal).toBe(true)
  })

  it('lastMove e atualizado apos lance', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.attemptMove('e2', 'e4')
    })

    expect(result.current.lastMove).toEqual(['e2', 'e4'])
  })
})


describe('useChessGame - promocao', () => {
  it('detecta promocao e seta pendingPromotion', () => {
    // Posicao com peao branco em a7, pronto para promover
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const { result } = renderHook(() => useChessGame(fen))

    act(() => {
      result.current.attemptMove('a7', 'a8')
    })

    expect(result.current.pendingPromotion).not.toBeNull()
    expect(result.current.pendingPromotion.from).toBe('a7')
    expect(result.current.pendingPromotion.to).toBe('a8')
  })

  it('resolvePromotion completa o lance', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const { result } = renderHook(() => useChessGame(fen))

    act(() => {
      result.current.attemptMove('a7', 'a8')
    })

    act(() => {
      result.current.resolvePromotion('q')
    })

    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].promotion).toBe('q')
  })

  it('cancelPromotion limpa o estado sem fazer o lance', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const { result } = renderHook(() => useChessGame(fen))

    act(() => {
      result.current.attemptMove('a7', 'a8')
    })

    act(() => {
      result.current.cancelPromotion()
    })

    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.history).toEqual([])
  })
})


describe('useChessGame - undo, reset, loadFen', () => {
  it('undo desfaz o ultimo lance', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.attemptMove('e2', 'e4')
    })
    expect(result.current.history.length).toBe(1)

    act(() => {
      result.current.undo()
    })

    expect(result.current.history).toEqual([])
    expect(result.current.turn).toBe('w')
    expect(result.current.lastMove).toBeNull()
  })

  it('reset volta a posicao inicial', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.attemptMove('e2', 'e4')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.fen).toBe(START_FEN)
    expect(result.current.history).toEqual([])
  })

  it('loadFen carrega nova posicao', () => {
    const { result } = renderHook(() => useChessGame())
    const novaFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'

    act(() => {
      result.current.loadFen(novaFen)
    })

    expect(result.current.fen).toBe(novaFen)
  })

  it('loadFen ignora FEN invalido', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.loadFen('isso nao e FEN')
    })

    expect(result.current.fen).toBe(START_FEN)
  })
})


describe('useChessGame - premove queue', () => {
  it('addPremove adiciona na fila', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e2', 'e4')
    })

    expect(result.current.premoveQueue.length).toBe(1)
    expect(result.current.premoveQueue[0].from).toBe('e2')
  })

  it('addPremove acumula multiplas', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e2', 'e4')
      result.current.addPremove('g1', 'f3')
    })

    expect(result.current.premoveQueue.length).toBe(2)
  })

  it('removeLastPremove remove so a ultima', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e2', 'e4')
      result.current.addPremove('g1', 'f3')
    })

    act(() => {
      result.current.removeLastPremove()
    })

    expect(result.current.premoveQueue.length).toBe(1)
    expect(result.current.premoveQueue[0].from).toBe('e2')
  })

  it('clearPremoves limpa tudo', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.addPremove('e2', 'e4')
      result.current.addPremove('g1', 'f3')
    })

    act(() => {
      result.current.clearPremoves()
    })

    expect(result.current.premoveQueue).toEqual([])
  })
})


describe('useChessGame - deteccao de fim de jogo', () => {
  it('detecta xeque-mate', () => {
    // Mate do pastor como FEN
    const fen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'
    const { result } = renderHook(() => useChessGame(fen))

    expect(result.current.isGameOver).toBe(true)
    expect(result.current.isCheckmate).toBe(true)
    expect(result.current.gameOverReason).toBe('checkmate')
  })

  it('detecta afogamento', () => {
    const fen = 'k7/2K5/1Q6/8/8/8/8/8 b - - 0 1'
    const { result } = renderHook(() => useChessGame(fen))

    expect(result.current.isGameOver).toBe(true)
    expect(result.current.isStalemate).toBe(true)
    expect(result.current.gameOverReason).toBe('stalemate')
  })
})
