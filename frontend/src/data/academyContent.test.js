import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'

// Carrega TODOS os JSONs da academia dinamicamente no momento do teste
const modules = import.meta.glob('../data/academy/*/*.json', { eager: true })

describe('Validacao Automatica de Conteudo da Academia', () => {
  const lessons = Object.values(modules).map(m => m.default || m)

  it('deve ter carregado licoes', () => {
    expect(lessons.length).toBeGreaterThan(0)
  })

  for (const lesson of lessons) {
    if (!lesson || !lesson.id) continue

    describe(`Licao: ${lesson.title || lesson.id}`, () => {
      it('deve ter metadados basicos', () => {
        expect(lesson.id).toBeTruthy()
        expect(lesson.title).toBeTruthy()
        expect(lesson.explanation).toBeTruthy()
      })

      if (lesson.demo && lesson.demo.fen) {
        it('FEN da demonstracao e valido e tem reis', () => {
          // O construtor do chess.js lança erro se o FEN for invalido (ex: faltando reis)
          expect(() => new Chess(lesson.demo.fen)).not.toThrow()
        })
      }

      if (lesson.exercises && lesson.exercises.length > 0) {
        for (const ex of lesson.exercises) {
          it(`Exercicio ${ex.id} tem FEN valido`, () => {
            // O construtor do chess.js lança erro se o FEN for invalido (evita tela branca)
            expect(() => new Chess(ex.fen)).not.toThrow()
          })

          it(`Exercicio ${ex.id} tem lances esperados e nao esta finalizado`, () => {
            expect(Array.isArray(ex.expected)).toBe(true)
            expect(ex.expected.length).toBeGreaterThan(0)

            // Aplica o setup, se existir
            const chess = new Chess(ex.fen)
            if (ex.setup) {
              for (const uci of ex.setup) {
                const from = uci.slice(0, 2)
                const to = uci.slice(2, 4)
                try {
                  chess.move({ from, to, promotion: uci.length > 4 ? uci[4] : 'q' })
                } catch (e) {
                  throw new Error(`Setup falhou no lance ${uci}: ${e.message}`, { cause: e })
                }
              }
            }

            const expectedUci = ex.expected[0]
            const from = expectedUci.slice(0, 2)
            const to = expectedUci.slice(2, 4)
            const promotion = expectedUci.length > 4 ? expectedUci[4] : undefined

            // Verifica se a peca ja nao esta na casa de destino
            const pieceAtDest = chess.get(to)
            const pieceAtFrom = chess.get(from)
            
            expect(pieceAtFrom).not.toBeNull()
            
            if (pieceAtDest) {
              // Se for uma captura, ok. Mas se for a mesma peca ja estando la, eh bug.
              if (pieceAtFrom.color === pieceAtDest.color && pieceAtFrom.type === pieceAtDest.type) {
                throw new Error(`A peca ja esta em ${to}. FEN errado para o exercicio.`)
              }
            }

            // Verifica se o lance e legal
            const moveObj = { from, to }
            if (promotion) moveObj.promotion = promotion
            
            // Se falhar aqui, o lance nao e possivel (exercicio impossivel)
            expect(() => chess.move(moveObj)).not.toThrow()
          })
        }
      }
    })
  }
})
