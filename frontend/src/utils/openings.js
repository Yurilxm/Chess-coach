/**
 * Banco de aberturas de xadrez (classificação ECO).
 * 
 * Cada abertura é identificada por uma sequência de lances UCI
 * (ex: "e2e4 e7e5 g1f3") e tem um código ECO, nome e variante.
 * 
 * O algoritmo percorre o histórico da partida e encontra a abertura
 * mais específica que corresponde aos lances jogados.
 */

const OPENINGS = [
  // ====== E01-E09: Aberturas de Peão-Dama ======
  {
    code: 'A00',
    name: 'Abertura Irregular',
    moves: [],
  },
  {
    code: 'A40',
    name: 'Defesa Polonesa',
    moves: ['d2d4', 'b7b5'],
  },
  {
    code: 'A45',
    name: 'Ataque Trompowsky',
    moves: ['d2d4', 'g8f6', 'c1g5'],
  },
  {
    code: 'A48',
    name: 'Defesa Índia do Rei (Pirc)',
    moves: ['d2d4', 'g8f6', 'g1f3', 'g7g6'],
  },
  
  // ====== B00-B09: Defesas contra 1.e4 ======
  {
    code: 'B00',
    name: 'Defesa Escandinava',
    moves: ['e2e4', 'd7d5'],
  },
  {
    code: 'B01',
    name: 'Defesa Escandinava',
    moves: ['e2e4', 'd7d5', 'e4d5', 'd8d5'],
  },
  {
    code: 'B06',
    name: 'Defesa Moderna (Robatsch)',
    moves: ['e2e4', 'g7g6'],
  },
  {
    code: 'B07',
    name: 'Defesa Pirc',
    moves: ['e2e4', 'd7d6', 'd2d4', 'g8f6'],
  },
  
  // ====== B10-B19: Defesa Caro-Kann ======
  {
    code: 'B10',
    name: 'Defesa Caro-Kann',
    moves: ['e2e4', 'c7c6'],
  },
  {
    code: 'B12',
    name: 'Caro-Kann, Variante do Avanço',
    moves: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'e4e5'],
  },
  {
    code: 'B18',
    name: 'Caro-Kann, Variante Clássica',
    moves: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'b1c3', 'd5e4', 'c3e4', 'c8f5'],
  },
  
  // ====== B20-B29: Defesa Siciliana ======
  {
    code: 'B20',
    name: 'Defesa Siciliana',
    moves: ['e2e4', 'c7c5'],
  },
  {
    code: 'B22',
    name: 'Siciliana, Variante Alapin',
    moves: ['e2e4', 'c7c5', 'c2c3'],
  },
  {
    code: 'B30',
    name: 'Siciliana, Variante Rossolimo',
    moves: ['e2e4', 'c7c5', 'g1f3', 'b8c6', 'f1b5'],
  },
  {
    code: 'B40',
    name: 'Siciliana, Variante Paulsen',
    moves: ['e2e4', 'c7c5', 'g1f3', 'e7e6'],
  },
  {
    code: 'B50',
    name: 'Siciliana, Variante Scheveningen',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'e7e6'],
  },
  {
    code: 'B70',
    name: 'Siciliana, Dragão',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'g7g6'],
  },
  {
    code: 'B80',
    name: 'Siciliana, Najdorf',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'a7a6'],
  },
  
  // ====== B30-B39: Defesa Francesa ======
  {
    code: 'C00',
    name: 'Defesa Francesa',
    moves: ['e2e4', 'e7e6'],
  },
  {
    code: 'C02',
    name: 'Francesa, Variante do Avanço',
    moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'e4e5'],
  },
  {
    code: 'C10',
    name: 'Francesa, Variante Rubinstein',
    moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'b1c3', 'd5e4'],
  },
  
  // ====== C20-C29: Aberturas Abertas (1.e4 e5) ======
  {
    code: 'C20',
    name: 'Abertura do Centro',
    moves: ['e2e4', 'e7e5', 'd2d4'],
  },
  {
    code: 'C25',
    name: 'Abertura Vienense',
    moves: ['e2e4', 'e7e5', 'b1c3'],
  },
  {
    code: 'C30',
    name: 'Gambito do Rei',
    moves: ['e2e4', 'e7e5', 'f2f4'],
  },
  
  // ====== C40-C49: Defesa Philidor, Abertura Italiana ======
  {
    code: 'C41',
    name: 'Defesa Philidor',
    moves: ['e2e4', 'e7e5', 'g1f3', 'd7d6'],
  },
  {
    code: 'C44',
    name: 'Abertura Escocesa',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4'],
  },
  {
    code: 'C45',
    name: 'Abertura Escocesa, Gambito',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4', 'e5d4', 'f1c4'],
  },
  
  // ====== C50-C59: Italiana / Piano ======
  {
    code: 'C50',
    name: 'Abertura Italiana (Giuoco Piano)',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
  },
  {
    code: 'C54',
    name: 'Italiana, Giuoco Pianissimo',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'd2d3'],
  },
  {
    code: 'C57',
    name: 'Ataque Fegatello (Fried Liver)',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'f3g5', 'd7d5', 'e4d5', 'f6d5', 'g5f7'],
  },
  
  // ====== C60-C79: Ruy López ======
  {
    code: 'C60',
    name: 'Ruy López (Abertura Espanhola)',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
  },
  {
    code: 'C65',
    name: 'Ruy López, Defesa Berlinense',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'g8f6'],
  },
  {
    code: 'C78',
    name: 'Ruy López, Variante Fechada',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6'],
  },
  {
    code: 'C88',
    name: 'Ruy López, Variante Marshall',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6', 'e1g1', 'f8e7', 'f1e1', 'b7b5', 'a4b3', 'e8g8', 'c2c3', 'd7d5'],
  },
  
  // ====== D00-D69: Gambito da Dama ======
  {
    code: 'D00',
    name: 'Abertura de Peão-Dama',
    moves: ['d2d4', 'd7d5'],
  },
  {
    code: 'D02',
    name: 'Abertura de Peão-Dama, Sistema Londres',
    moves: ['d2d4', 'd7d5', 'g1f3', 'g8f6', 'c1f4'],
  },
  {
    code: 'D06',
    name: 'Gambito da Dama',
    moves: ['d2d4', 'd7d5', 'c2c4'],
  },
  {
    code: 'D10',
    name: 'Gambito da Dama, Defesa Eslava',
    moves: ['d2d4', 'd7d5', 'c2c4', 'c7c6'],
  },
  {
    code: 'D15',
    name: 'Gambito da Dama, Eslava Aceito',
    moves: ['d2d4', 'd7d5', 'c2c4', 'c7c6', 'g1f3', 'g8f6', 'b1c3', 'd5c4'],
  },
  {
    code: 'D30',
    name: 'Gambito da Dama Recusado',
    moves: ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
  },
  {
    code: 'D37',
    name: 'Gambito da Dama, Variante Clássica',
    moves: ['d2d4', 'd7d5', 'c2c4', 'e7e6', 'b1c3', 'g8f6', 'g1f3', 'f8e7'],
  },
  
  // ====== D70-D99: Defesas Índias ======
  {
    code: 'D70',
    name: 'Defesa Índia do Rei',
    moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7'],
  },
  {
    code: 'D85',
    name: 'Índia do Rei, Variante Clássica',
    moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7', 'e2e4', 'd7d6'],
  },
  {
    code: 'E00',
    name: 'Defesa Índia da Dama',
    moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g1f3', 'b7b6'],
  },
  {
    code: 'E12',
    name: 'Índia da Dama, Variante Petrosian',
    moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g1f3', 'b7b6', 'a2a3'],
  },
  {
    code: 'E20',
    name: 'Defesa Nimzo-Índia',
    moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4'],
  },
  
  // ====== E60-E99: Índia do Rei Moderna ======
  {
    code: 'E61',
    name: 'Índia do Rei, Variante Fianqueto',
    moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7', 'g1f3', 'e8g8', 'g2g3'],
  },
  
  // ====== A80-A99: Defesa Holandesa ======
  {
    code: 'A80',
    name: 'Defesa Holandesa',
    moves: ['d2d4', 'f7f5'],
  },
  {
    code: 'A90',
    name: 'Holandesa, Variante Leningrado',
    moves: ['d2d4', 'f7f5', 'g2g3', 'g8f6', 'f1g2', 'g7g6'],
  },
  
  // ====== A00-A39: Outras ======
  {
    code: 'A00',
    name: 'Abertura Bird',
    moves: ['f2f4'],
  },
  {
    code: 'A04',
    name: 'Abertura Réti',
    moves: ['g1f3'],
  },
  {
    code: 'A10',
    name: 'Abertura Inglesa',
    moves: ['c2c4'],
  },
  {
    code: 'A20',
    name: 'Abertura Inglesa, Variante Siciliana',
    moves: ['c2c4', 'e7e5'],
  },
  {
    code: 'A28',
    name: 'Inglesa, Quatro Cavalos',
    moves: ['c2c4', 'e7e5', 'b1c3', 'g8f6', 'g1f3', 'b8c6'],
  },
]

/**
 * Detecta a abertura baseada nos lances da partida.
 * 
 * @param {Array} history - Histórico verbose do chess.js
 * @returns {{ code: string, name: string } | null}
 */
export function detectOpening(history) {
  if (!history || history.length === 0) return null
  
  // Extrai apenas os lances UCI do histórico
  const playedMoves = history.map(move => move.from + move.to)
  
  // Procura a abertura mais específica (mais lances) que corresponde
  let bestMatch = null
  let bestLength = 0
  
  for (const opening of OPENINGS) {
    const openingMoves = opening.moves
    
    // Se a abertura não tem lances definidos (ex: A00 genérica), pula
    if (openingMoves.length === 0) continue
    
    // Verifica se os lances da partida correspondem ao início da abertura
    if (openingMoves.length > playedMoves.length) continue
    
    let matches = true
    for (let i = 0; i < openingMoves.length; i++) {
      if (openingMoves[i] !== playedMoves[i]) {
        matches = false
        break
      }
    }
    
    // Encontrou uma correspondência mais específica
    if (matches && openingMoves.length > bestLength) {
      bestMatch = opening
      bestLength = openingMoves.length
    }
  }
  
  return bestMatch ? { code: bestMatch.code, name: bestMatch.name } : null
}