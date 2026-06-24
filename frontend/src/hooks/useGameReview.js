import { useState, useCallback } from 'react'

const API_URL = 'http://localhost:8000/review'

export function useGameReview() {
  const [review, setReview] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  const requestReview = useCallback(async (history, playerColor) => {
    if (!history || history.length === 0) return
    
    setReviewLoading(true)
    setReview(null)
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, player_color: playerColor }),
      })
      if (!response.ok) throw new Error('Falha na revisão')
      const data = await response.json()
      setReview(data)
      return data
    } catch (err) {
      console.error('Erro na revisão:', err)
    } finally {
      setReviewLoading(false)
    }
  }, [])

  const clearReview = useCallback(() => setReview(null), [])

  return { review, reviewLoading, requestReview, clearReview }
}