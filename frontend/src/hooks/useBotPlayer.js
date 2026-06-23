import { useCallback, useRef, useState } from 'react'

const API_URL = 'http://localhost:8000/play'

export const DIFFICULTY_LEVELS = {
  200:  { name: 'Primeiros passos',  desc: 'Lances aleatórios. Ideal para aprender.' },
  400:  { name: 'Iniciante',          desc: 'Lances básicos, sem cálculo profundo.' },
  600:  { name: 'Aprendiz',           desc: 'Captura peças desprotegidas.' },
  800:  { name: 'Praticante',         desc: 'Controla o centro e desenvolve peças.' },
  1000: { name: 'Intermediário',      desc: 'Calcula táticas simples e pune erros.' },
  1200: { name: 'Competidor',         desc: 'Boa visão tática. Aproveita garfos.' },
  1400: { name: 'Avançado',           desc: 'Sólido estrategicamente.' },
  1600: { name: 'Especialista',       desc: 'Calcula variantes longas.' },
  1800: { name: 'Mestre',             desc: 'Explora fraquezas mínimas.' },
  2000: { name: 'Mestre Elite',       desc: 'Força de clube. Quase sem erros.' },
  2200: { name: 'Desafiante',         desc: 'Nível de campeonato.' },
  2400: { name: 'Grão-Mestre',        desc: 'Força de torneio internacional.' },
  2600: { name: 'Lenda',              desc: 'Nível de elite mundial.' },
  3000: { name: 'Stockfish Máximo',   desc: 'Força total. Desafio definitivo.' },
}

export function useBotPlayer() {
  const [difficulty, setDifficulty] = useState(1000)
  const [thinking, setThinking] = useState(false)
  const thinkingRef = useRef(false)

  const requestMove = useCallback(async (fen) => {
    if (thinkingRef.current) return null
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
  }
}