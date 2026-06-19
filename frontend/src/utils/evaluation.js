export function formatEvalScore(evaluation) {
  if (!evaluation) return ''
  if (evaluation.type === 'mate') {
    return `M${Math.abs(evaluation.value)}`
  }
  const val = evaluation.value / 100
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)
}

/**
 * Retorna um número de 0 a 100: o quanto da barra deve ficar
 * preenchida a favor das BRANCAS.
 */
export function evalToWhitePercent(evaluation) {
  if (!evaluation) return 50
  if (evaluation.type === 'mate') {
    return evaluation.value > 0 ? 97 : 3
  }
  const val = Math.max(-600, Math.min(600, evaluation.value))
  return ((val + 600) / 1200) * 100
}

export function evalDescriptionPt(evaluation) {
  if (!evaluation) return 'Posição inicial'
  if (evaluation.type === 'mate') {
    return evaluation.value > 0
      ? `Mate em ${Math.abs(evaluation.value)} para as brancas`
      : `Mate em ${Math.abs(evaluation.value)} para as pretas`
  }
  const val = evaluation.value / 100
  if (val > 3) return 'Posição vencedora para as brancas'
  if (val > 1.5) return 'Vantagem clara das brancas'
  if (val > 0.5) return 'Leve vantagem das brancas'
  if (val > -0.5) return 'Posição equilibrada'
  if (val > -1.5) return 'Leve vantagem das pretas'
  if (val > -3) return 'Vantagem clara das pretas'
  return 'Posição vencedora para as pretas'
}