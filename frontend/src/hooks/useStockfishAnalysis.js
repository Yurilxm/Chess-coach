import { useCallback, useRef, useState } from 'react'
import { ENDPOINTS } from '../utils/apiConfig'


export function useStockfishAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Ref pro AbortController atual. Se um novo analyze for chamado antes
  // do anterior terminar, o anterior e cancelado — so o ultimo seta state.
  const abortRef = useRef(null)

  const analyze = useCallback(async (fen, historyFens = null) => {
    if (!fen) return

    // Cancela request anterior
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const body = { fen }
      if (historyFens && historyFens.length > 0) {
        body.history = historyFens
      }

      const response = await fetch(ENDPOINTS.analyze, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Falha na análise')
      const data = await response.json()
      if (controller.signal.aborted) return
      setAnalysis(data)
      return data
    } catch (err) {
      // AbortError nao e erro de verdade — so cancelamos o request
      if (err.name === 'AbortError') return
      console.error('Erro na análise:', err)
      setError('Não foi possível conectar ao motor de análise. Verifique se o servidor local (porta 8000) está rodando.')
      setAnalysis(null)
    } finally {
      // So limpa o loading se essa ainda e a request mais recente
      if (abortRef.current === controller) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }, [])

  const clear = useCallback(() => {
    setAnalysis(null)
    setError(null)
  }, [])

  return { analysis, loading, error, analyze, clear }
}
