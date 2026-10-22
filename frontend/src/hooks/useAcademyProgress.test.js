import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAcademyProgress } from './useAcademyProgress'


beforeEach(() => {
  localStorage.clear()
})


describe('useAcademyProgress — estado inicial', () => {
  it('sem nada salvo, licao nao tem progresso', () => {
    const { result } = renderHook(() => useAcademyProgress())
    expect(result.current.getLessonProgress('movimento-peao')).toBeNull()
  })

  it('getState devolve estrutura vazia', () => {
    const { result } = renderHook(() => useAcademyProgress())
    const state = result.current.getState()
    expect(state.version).toBe(1)
    expect(state.lessons).toEqual({})
    expect(state.exercises).toEqual({})
  })
})


describe('useAcademyProgress — markLessonCompleted', () => {
  it('marca licao como concluida', () => {
    const { result } = renderHook(() => useAcademyProgress())
    act(() => {
      result.current.markLessonCompleted('movimento-peao')
    })
    const progress = result.current.getLessonProgress('movimento-peao')
    expect(progress.completed).toBe(true)
    expect(progress.completedAt).toBeTruthy()
  })

  it('nao muda completedAt em conclusao repetida', () => {
    const { result } = renderHook(() => useAcademyProgress())
    act(() => {
      result.current.markLessonCompleted('movimento-peao')
    })
    const first = result.current.getLessonProgress('movimento-peao').completedAt

    act(() => {
      result.current.markLessonCompleted('movimento-peao')
    })
    const second = result.current.getLessonProgress('movimento-peao').completedAt

    expect(first).toBe(second)
  })
})


describe('useAcademyProgress — markExerciseAttempt', () => {
  it('acerto incrementa attempts e correct', () => {
    const { result } = renderHook(() => useAcademyProgress())
    act(() => {
      result.current.markExerciseAttempt('movimento-peao', 'ex1', true)
    })
    const stats = result.current.getExerciseStats('movimento-peao', 'ex1')
    expect(stats.attempts).toBe(1)
    expect(stats.correct).toBe(1)
    expect(stats.wrong).toBe(0)
  })

  it('erro incrementa attempts e wrong', () => {
    const { result } = renderHook(() => useAcademyProgress())
    act(() => {
      result.current.markExerciseAttempt('movimento-peao', 'ex1', false)
    })
    const stats = result.current.getExerciseStats('movimento-peao', 'ex1')
    expect(stats.attempts).toBe(1)
    expect(stats.correct).toBe(0)
    expect(stats.wrong).toBe(1)
  })

  it('multiplas tentativas acumulam', () => {
    const { result } = renderHook(() => useAcademyProgress())
    act(() => {
      result.current.markExerciseAttempt('movimento-peao', 'ex1', false)
    })
    act(() => {
      result.current.markExerciseAttempt('movimento-peao', 'ex1', true)
    })
    const stats = result.current.getExerciseStats('movimento-peao', 'ex1')
    expect(stats.attempts).toBe(2)
    expect(stats.correct).toBe(1)
    expect(stats.wrong).toBe(1)
  })
})


describe('useAcademyProgress — resetAll', () => {
  it('limpa tudo', () => {
    const { result } = renderHook(() => useAcademyProgress())
    act(() => {
      result.current.markLessonCompleted('movimento-peao')
      result.current.markExerciseAttempt('movimento-peao', 'ex1', true)
    })

    act(() => {
      result.current.resetAll()
    })

    expect(result.current.getState().lessons).toEqual({})
    expect(result.current.getState().exercises).toEqual({})
  })
})


describe('useAcademyProgress — persistencia', () => {
  it('sobrevive a desmontar e remontar', () => {
    const primeiro = renderHook(() => useAcademyProgress())
    act(() => {
      primeiro.result.current.markLessonCompleted('movimento-peao')
    })
    primeiro.unmount()

    const segundo = renderHook(() => useAcademyProgress())
    const progress = segundo.result.current.getLessonProgress('movimento-peao')
    expect(progress.completed).toBe(true)
  })

  it('dado corrompido no localStorage vira estado vazio', () => {
    localStorage.setItem('chess-coach:academy-progress:v1', 'nao-e-json')
    const { result } = renderHook(() => useAcademyProgress())
    expect(result.current.getState().lessons).toEqual({})
  })
})
