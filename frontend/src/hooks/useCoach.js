import { useState, useCallback } from 'react'

const API_URL = 'http://localhost:8000/coach'

export function useCoach() {
  const [coachExplanation, setCoachExplanation] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)

  const explainMove = useCallback(async (fen, move, evaluation) => {
    if (!fen || !move) return
    
    setCoachLoading(true)
    setCoachExplanation(null)
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, move, evaluation }),
      })
      if (!response.ok) throw new Error('Falha na explicação')
      const data = await response.json()
      setCoachExplanation(data.explanation)
      return data
    } catch (err) {
      console.error('Erro no coach:', err)
      setCoachExplanation('O coach está temporariamente indisponível.')
    } finally {
      setCoachLoading(false)
    }
  }, [])

  const clearCoach = useCallback(() => {
    setCoachExplanation(null)
  }, [])

  return { coachExplanation, coachLoading, explainMove, clearCoach }
}