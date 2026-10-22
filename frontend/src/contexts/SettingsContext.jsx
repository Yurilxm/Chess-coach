import { useState, useEffect } from 'react'
import { SettingsContext, BOARD_THEMES, PIECE_THEMES } from './useSettings'

export function SettingsProvider({ children }) {
  const [boardTheme, setBoardTheme] = useState(() => localStorage.getItem('chess-coach:board-theme') || 'brown')
  const [pieceTheme, setPieceTheme] = useState(() => localStorage.getItem('chess-coach:piece-theme') || 'classic')
  
  useEffect(() => {
    localStorage.setItem('chess-coach:board-theme', boardTheme)
    localStorage.setItem('chess-coach:piece-theme', pieceTheme)
  }, [boardTheme, pieceTheme])

  return (
    <SettingsContext.Provider value={{ 
      boardTheme, setBoardTheme, 
      pieceTheme, setPieceTheme,
      boardThemes: BOARD_THEMES,
      pieceThemes: PIECE_THEMES
    }}>
      {children}
    </SettingsContext.Provider>
  )
}
