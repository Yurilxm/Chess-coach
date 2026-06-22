import { useCallback, useRef, useState } from 'react'

const API_URL = 'http://localhost:8000/play'

const DIFFICULTY_PRESETS = {
  beginner:     { label: 'Iniciante (1350)',   value: 'beginner' },
  casual:       { label: 'Casual (1500)',      value: 'casual' },
  intermediate: { label: 'Intermediário (1800)', value: 'intermediate' },
  advanced:     { label: 'Avançado (2100)',     value: 'advanced' },
  expert:       { label: 'Especialista (2500)', value: 'expert' },
  stockfish:    { label: 'Stockfish (3000)',    value: 'stockfish' },
}

export function useBotPlayer() {
  const [difficulty, setDifficulty] = useState('intermediate')
  const [thinking, setThinking] = useState(false)
  const thinkingRef = useRef(false)

  const requestMove = useCallback(async (fen) => {
    if (thinkingRef.current) return null // Evita múltiplas chamadas
    thinkingRef.current = true
    setThinking(true)
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, difficulty }),
      })
      if (!response.ok) throw new Error('Falha ao obter lance do bot')
      const data = await response.json()
      return data
    } catch (err) {
      console.error('Erro no bot:', err)
      return null
    } finally {
      setThinking(false)
      thinkingRef.current = false
    }
  }, [difficulty])

  return {
    difficulty,
    setDifficulty,
    thinking,
    requestMove,
    difficultyPresets: DIFFICULTY_PRESETS,
  }
}