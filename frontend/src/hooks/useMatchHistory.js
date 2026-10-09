import { useCallback, useState } from 'react'

const STORAGE_KEY = 'chess-coach:matches:v1'
const SCHEMA_VERSION = 1
const MAX_MATCHES = 50


// ---------------------------------------------------------------------------
// Acesso cru ao localStorage (isolado para facilitar teste e troca futura
// por backend/SQLite sem tocar no resto do hook).
// ---------------------------------------------------------------------------

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    // Dado corrompido: nao derruba o app, so ignora o historico.
    return []
  }
}


function writeRaw(matches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches))
    return true
  } catch {
    // Quota cheia / modo privado bloqueado: ignora silenciosamente.
    return false
  }
}


function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}


// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMatchHistory() {
  // Estado interno so pra forcar re-render depois de salvar/remover.
  // O conteudo real esta sempre no localStorage.
  const [version, setVersion] = useState(0)

  const bumpVersion = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  /**
   * Lista as partidas salvas, mais recentes primeiro.
   */
  const listMatches = useCallback(() => {
    const matches = readRaw()
    return [...matches].sort((a, b) => {
      const ta = a?.savedAt || ''
      const tb = b?.savedAt || ''
      return tb.localeCompare(ta)
    })
    // version entra nas deps pra o hook consumidor saber quando recarregar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  /**
   * Salva uma partida. Espera:
   *   {
   *     playerColor, difficulty, review (objeto completo), history,
   *     durationSeconds (opcional)
   *   }
   *
   * Gera id e timestamp automaticamente. Descarta a partida mais antiga
   * se passar do limite MAX_MATCHES.
   */
  const saveMatch = useCallback((data) => {
    if (!data || !data.review) return null

    const entry = {
      schemaVersion: SCHEMA_VERSION,
      id: generateId(),
      savedAt: new Date().toISOString(),
      playerColor: data.playerColor || null,
      difficulty: data.difficulty ?? null,
      durationSeconds: data.durationSeconds ?? null,
      // Copia so o que interessa do review (evita lixo de versoes antigas).
      review: {
        result: data.review.result,
        result_reason: data.review.result_reason,
        stats: data.review.stats,
        mistakes: data.review.mistakes,
        all_moves: data.review.all_moves,
        summary: data.review.summary,
      },
      // Historico dos lances (verbose do chess.js), usado pro replay.
      history: Array.isArray(data.history) ? data.history : [],
    }

    const current = readRaw()
    // Ordena antes de cortar (defensivo contra dado antigo fora de ordem)
    const sorted = [...current].sort((a, b) => {
      const ta = a?.savedAt || ''
      const tb = b?.savedAt || ''
      return tb.localeCompare(ta)
    })
    const trimmed = [entry, ...sorted].slice(0, MAX_MATCHES)
    writeRaw(trimmed)
    bumpVersion()
    return entry
  }, [bumpVersion])

  /**
   * Retorna uma partida pelo id, ou null.
   */
  const getMatch = useCallback((id) => {
    const matches = readRaw()
    return matches.find((m) => m.id === id) || null
  }, [])

  /**
   * Apaga uma partida especifica. Retorna true se removeu algo.
   */
  const deleteMatch = useCallback((id) => {
    const matches = readRaw()
    const filtered = matches.filter((m) => m.id !== id)
    if (filtered.length === matches.length) return false
    writeRaw(filtered)
    bumpVersion()
    return true
  }, [bumpVersion])

  /**
   * Apaga TODAS as partidas.
   */
  const clearAll = useCallback(() => {
    writeRaw([])
    bumpVersion()
  }, [bumpVersion])

  return {
    listMatches,
    saveMatch,
    getMatch,
    deleteMatch,
    clearAll,
    // Exposto pra testes e pra UI saber o limite.
    MAX_MATCHES,
  }
}
