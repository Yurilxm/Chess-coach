import { createContext, useContext } from 'react'

export const BOARD_THEMES = [
  { id: 'brown', name: 'Clássico', color: '#b58863' },
  { id: 'blue', name: 'Oceano', color: '#4a6c8a' },
  { id: 'green', name: 'Floresta', color: '#3a6c4c' },
  { id: 'purple', name: 'Nebulosa', color: '#665a78' },
  { id: 'dark', name: 'Meia-noite', color: '#2c2c2c' },
]

export const PIECE_THEMES = [
  { id: 'classic', name: 'Clássico', style: {} },
  { id: 'wood', name: 'Madeira', style: { filter: 'sepia(0.6) contrast(1.2)' } },
  { id: 'glass', name: 'Vidro', style: { filter: 'opacity(0.8) drop-shadow(0 0 2px rgba(255,255,255,0.6))' } },
  { id: 'vintage', name: 'Vintage', style: { filter: 'sepia(1) hue-rotate(15deg) contrast(1.1)' } },
]

export const SettingsContext = createContext(null)

export function useSettings() {
  const ctx = useContext(SettingsContext)
  // Fallback para testes ou componentes renderizados isoladamente
  if (!ctx) {
    return {
      boardTheme: 'brown', setBoardTheme: () => {},
      pieceTheme: 'classic', setPieceTheme: () => {},
      boardThemes: BOARD_THEMES, pieceThemes: PIECE_THEMES
    }
  }
  return ctx
}
