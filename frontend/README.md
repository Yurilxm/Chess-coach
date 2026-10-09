# Chess Coach — Frontend

Interface React do Chess Coach. Consome a API FastAPI em backend/.

## Stack

- React 19 + Vite 8
- Chessground (tabuleiro) + chess.js (regras)
- Tailwind CSS 4
- Vitest + Testing Library

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5173.

## Scripts

| Comando | O que faz |
|---------|-----------|
| npm run dev | Servidor de desenvolvimento (Vite) |
| npm run build | Build de producao |
| npm run preview | Preview do build |
| npm test | Roda os testes uma vez (vitest run) |
| npm run test:watch | Testes em modo watch |
| npm run lint | ESLint |

## Variaveis de ambiente

Copie .env.example para .env se precisar apontar para outra API:

```env
VITE_API_URL=http://localhost:8000
```

Se nao definido, cai no default http://localhost:8000.

## Estrutura

```text
src/
├── components/       # Componentes visuais (ChessBoard, GameView, AnalysisPanel...)
├── hooks/            # Estado da partida e chamadas a API
├── utils/            # Helpers puros (chessHelpers, evaluation, openings...)
├── test/setup.js     # Setup do vitest
├── App.jsx
└── main.jsx
```

### Componentes notaveis

- **ChessBoard.jsx** — espelha props no Chessground. Nao guarda estado de xadrez, nao valida regras. Toda a logica mora nos hooks.
- **GameReviewModal.jsx** — mostra estatisticas pos-partida e permite replay lance a lance num mini tabuleiro.

### Hooks

- **useChessGame** — estado do modo Jogo/Bot: historico, premove, promocao, deteccao de fim de jogo.
- **useChessEditor** — estado do modo Editor: move pecas livremente, sem respeitar turno.
- **useStockfishAnalysis** — analise via backend, com AbortController (clicks rapidos nao se atropelam).
- **useBotPlayer** — pede lances do bot, envia o historico para ele decidir a abertura.
- **useCoach** — explicacao da IA via Gemini.
- **useGameReview** — revisao pos-partida.

## Testes

```bash
npm test
```

122 testes cobrindo:

- utils/ — helpers de xadrez, avaliacao, traducao de lances, aberturas ECO, destinos do editor
- hooks/ — useChessGame, useChessEditor, useStockfishAnalysis

## Lint

```bash
npm run lint
```

O eslint.config.js rebaixa duas regras novas do eslint-plugin-react-hooks@7 (refs e set-state-in-effect) para **warning** — o codigo usa ref.current durante o render de forma consciente, ja que o chess.js e um objeto mutavel que nao precisa disparar re-render a cada mudanca. Ver comentario no arquivo.
