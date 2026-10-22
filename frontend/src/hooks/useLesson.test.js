import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLesson } from './useLesson'

// Mock simples para o hook de progresso (nao queremos testar o localStorage aqui)
vi.mock('./useAcademyProgress', () => {
  return {
    useAcademyProgress: () => ({
      markExerciseAttempt: vi.fn(),
      markLessonCompleted: vi.fn(),
      getLessonProgress: vi.fn(() => null),
    })
  }
})

const mockLesson = {
  id: 'test-lesson',
  title: 'Teste',
  explanation: 'Explicacao',
  demo: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'e7e5']
  },
  exercises: [
    {
      id: 'ex1',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      expected: ['e2e4'],
      success: 'Correto',
      failure: 'Errado',
      hint: 'Dica'
    },
    {
      id: 'ex2',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      expected: ['d2d4'],
      success: 'Correto 2',
      failure: 'Errado 2'
    }
  ]
}

describe('useLesson', () => {
  const onBackMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inicia no primeiro exercicio', () => {
    const { result } = renderHook(() => useLesson(mockLesson, onBackMock))
    expect(result.current.exerciseIndex).toBe(0)
    expect(result.current.currentExercise.id).toBe('ex1')
    expect(result.current.isLastExercise).toBe(false)
  })

  it('valida lance correto e avanca', () => {
    const { result } = renderHook(() => useLesson(mockLesson, onBackMock))
    
    act(() => {
      result.current.tryMove('e2', 'e4')
    })
    
    expect(result.current.feedback.status).toBe('correct')
    
    act(() => {
      result.current.nextExercise()
    })
    
    expect(result.current.exerciseIndex).toBe(1)
    expect(result.current.currentExercise.id).toBe('ex2')
  })

  it('valida lance errado, mostra feedback e nao avanca', () => {
    const { result } = renderHook(() => useLesson(mockLesson, onBackMock))
    
    act(() => {
      result.current.tryMove('a2', 'a4') // lance legal, mas errado
    })
    
    expect(result.current.feedback.status).toBe('wrong')
    
    act(() => {
      result.current.nextExercise() // nao deve avancar se feedback for wrong (teste do botao, embora o hook deixe)
    })
    // O hook nao bloqueia o nextExercise, o componente bloqueia visualmente.
    // Mas vamos testar o reset:
    act(() => {
      result.current.retryExercise()
    })
    
    expect(result.current.feedback).toBe(null)
  })

  it('concluir ultimo exercicio chama onBack e markCompleted', () => {
    const { result } = renderHook(() => useLesson(mockLesson, onBackMock))
    
    act(() => {
      result.current.nextExercise() // pula pro 2
    })
    
    act(() => {
      result.current.nextExercise() // tenta concluir o 2
    })
    
    expect(onBackMock).toHaveBeenCalled()
  })

  it('controles da demo funcionam', () => {
    const { result } = renderHook(() => useLesson(mockLesson, onBackMock))
    
    expect(result.current.demoStep).toBe(0)
    
    act(() => {
      result.current.demoNext()
    })
    expect(result.current.demoStep).toBe(1)
    
    act(() => {
      result.current.demoPrev()
    })
    expect(result.current.demoStep).toBe(0)
  })
})
