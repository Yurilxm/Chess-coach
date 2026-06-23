import { useCallback, useState } from 'react'

const API_URL = 'http://localhost:8000/analyze'

export function useStockfishAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyze = useCallback(async (fen, historyFens = null) => {
    if (!fen) return
    setLoading(true)
    setError(null)
    try {
      const body = { fen }
      if (historyFens && historyFens.length > 0) {
        body.history = historyFens
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('Falha na análise')
      const data = await response.json()
      setAnalysis(data)
      return data
    } catch (err) {
      console.error('Erro na análise:', err)
      setError('Não foi possível conectar ao motor de análise. Verifique se o servidor local (porta 8000) está rodando.')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setAnalysis(null)
    setError(null)
  }, [])

  return { analysis, loading, error, analyze, clear }
}