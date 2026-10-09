// URL base da API. Configuravel via .env do frontend:
//   VITE_API_URL=http://localhost:8000
// Se nao definido, cai no default de desenvolvimento.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const ENDPOINTS = {
  analyze: `${API_BASE_URL}/analyze`,
  play: `${API_BASE_URL}/play`,
  coach: `${API_BASE_URL}/coach`,
  review: `${API_BASE_URL}/review`,
}
