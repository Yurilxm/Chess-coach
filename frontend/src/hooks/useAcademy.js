import { useMemo } from 'react'

// Carrega TODAS as licoes de uma vez, no build, via import.meta.glob do Vite.
// Cada arquivo JSON vira um objeto. Nao tem fetch, nao tem loading.
const modules = import.meta.glob('../data/academy/*/*.json', { eager: true })

// Carrega o catalogo (metadados leves, tambem no build).
import catalogo from '../data/academy/index.json'


function flattenLessons() {
  const lessons = []
  for (const path in modules) {
    const mod = modules[path]
    const data = mod?.default || mod
    if (data && data.id) lessons.push(data)
  }
  return lessons
}


export function useAcademy() {
  const lessons = useMemo(() => flattenLessons(), [])

  const getLessonById = useMemo(() => {
    return (id) => lessons.find((l) => l.id === id) || null
  }, [lessons])

  const categories = useMemo(() => {
    const set = new Set(lessons.map((l) => l.category))
    return Array.from(set)
  }, [lessons])

  const levels = useMemo(() => {
    const set = new Set(lessons.map((l) => l.level))
    return Array.from(set)
  }, [lessons])

  const filterLessons = useMemo(() => {
    return ({ level = null, category = null, search = '' } = {}) => {
      const q = search.trim().toLowerCase()
      return lessons.filter((l) => {
        if (level && l.level !== level) return false
        if (category && l.category !== category) return false
        if (q) {
          const hay = `${l.title} ${l.objective || ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
    }
  }, [lessons])

  return {
    lessons,
    catalog: catalogo,
    getLessonById,
    categories,
    levels,
    filterLessons,
  }
}
