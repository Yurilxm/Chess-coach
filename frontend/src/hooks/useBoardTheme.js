import { useState, useEffect } from 'react'

export const THEMES = [
  { id: 'brown', name: 'Clássico (Marrom)', color: '#b58863' },
  { id: 'blue', name: 'Oceano (Azul)', color: '#4a6c8a' },
  { id: 'green', name: 'Floresta (Verde)', color: '#3a6c4c' },
  { id: 'purple', name: 'Nebulosa (Roxo)', color: '#665a78' },
  { id: 'dark', name: 'Meia-noite (Escuro)', color: '#2c2c2c' },
]

export function useBoardTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('chess-coach:board-theme') || 'brown'
  })
  
  useEffect(() => {
    localStorage.setItem('chess-coach:board-theme', theme)
  }, [theme])

  return { theme, setTheme, themes: THEMES }
}
