# Chess Coach — Frontend

Interface React do Chess Coach. Consome a API FastAPI em `backend/`.

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
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm test` | Roda os testes uma vez (vitest run) |
| `npm run test:watch` | Testes em modo watch |
| `npm run lint` | ESLint |

## Variáveis de ambiente

Copie `.env.example` para `.env` se precisar apontar para outra API:

```env
VITE_API_URL=http://localhost:8000
```

Se não definido, cai no default `http://localhost:8000`.

## Estrutura

```text
src/
├── components/           # Componentes visuais
│   ├── ChessBoard.jsx    # Espelha props no Chessground
│   ├── GameView.jsx      # Modo Jogo/Bot
│   ├── EditorView.jsx    # Modo Editor
│   ├── GameReviewModal.jsx # Análise pós-partida com replay
│   ├── MatchHistoryView.jsx # Histórico de partidas
│   └── ...
├── hooks/                # Estado da partida e chamadas à API
│   ├── useChessGame.js   # Estado do jogo (histórico, premove, promoção)
│   ├── useChessEditor.js # Estado do editor
│   ├── useStockfishAnalysis.js
│   ├── useBotPlayer.js
│   ├── useCoach.js
│   ├── useGameReview.js
│   └── useMatchHistory.js # Persistência em localStorage
├── utils/                # Helpers puros
│   ├── chessHelpers.js
│   ├── pieceMovement.js
│   ├── evaluation.js
│   ├── moveTranslation.js
│   ├── openings.js       # Catálogo ECO
│   └── apiConfig.js      # Única fonte das URLs da API
├── test/setup.js         # Setup do vitest
├── App.jsx
└── main.jsx
```

### Componentes notáveis

- **`ChessBoard.jsx`** — espelha props no Chessground. Não guarda estado de xadrez, não valida regras. Toda a lógica mora nos hooks.
- **`GameReviewModal.jsx`** — análise pós-partida com:
  - Tabuleiro de replay (abre já no último lance)
  - Seta indicando o lance atual
  - Badge de categoria (brilhante, melhor, erro, blunder...)
  - Grid de contadores clicáveis para filtrar lances por categoria
  - Lista completa de erros para revisar com explicação do coach (Gemini)
- **`MatchHistoryView.jsx`** — lista de partidas salvas com estatísticas. Clicar reabre o `GameReviewModal`.

### Hooks

- **`useChessGame`** — estado do modo Jogo/Bot: histórico, premove, promoção, detecção de fim de jogo.
- **`useChessEditor`** — estado do modo Editor: move peças livremente, sem respeitar turno.
- **`useStockfishAnalysis`** — análise via backend, com `AbortController` (clicks rápidos não se atropelam).
- **`useBotPlayer`** — pede lances do bot, envia o histórico para ele decidir a abertura.
- **`useCoach`** — explicação da IA via Gemini, com fallback heurístico.
- **`useGameReview`** — revisão pós-partida.
- **`useMatchHistory`** — salva as 50 partidas mais recentes em `localStorage`. Isola o acesso ao storage — trocar por API/SQLite no futuro é só mudar a implementação interna.

## Testes

```bash
npm test
```

174 testes cobrindo:

- **`utils/`** — helpers de xadrez, avaliação, tradução de lances, aberturas ECO, destinos do editor
- **`hooks/useChessGame*`** — estado do jogo + premove (fila, execução, cancelamento)
- **`hooks/useChessEditor*`** — estado do editor (place, remove, undo, FEN inválido)
- **`hooks/useStockfishAnalysis`** — chamadas à API (sucesso, erro, abort)
- **`hooks/useMatchHistory`** — persistência, ordenação, limite, quota cheia

## Lint

```bash
npm run lint
```

O `eslint.config.js` rebaixa duas regras novas do `eslint-plugin-react-hooks@7` (`refs` e `set-state-in-effect`) para **warning** — o código usa `ref.current` durante o render de forma consciente, já que o `chess.js` é um objeto mutável que não precisa disparar re-render a cada mudança. Ver comentário no arquivo.
