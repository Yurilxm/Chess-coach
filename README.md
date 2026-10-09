# Chess Coach

Treinador pessoal de xadrez com análise do Stockfish e explicações com IA (Gemini).

## Funcionalidades

- **Tabuleiro interativo** com drag and drop, destaque de lances válidos e histórico de jogadas
- **Análise com Stockfish** — top 3 lances recomendados + avaliação da posição
- **Explicações com IA (Gemini)** — cada lance ganha uma explicação em linguagem natural
- **Modo Editor** — monte posições via FEN ou arrastando peças para estudo dirigido
- **Modo Bot** — jogue contra o Stockfish com 14 níveis de dificuldade (rating 200 a 3000)
- **Revisão pós-partida** — relatório completo com precisão, classificação de cada lance e estatísticas
- **Histórico de partidas** — as 50 partidas mais recentes ficam salvas no navegador
- **Pré-jogadas** — fila de lances planejados enquanto o bot pensa

### Classificação de lances

A revisão classifica cada lance seu em uma das categorias:

| Categoria | Significado |
|-----------|-------------|
| **Brilhante** | Sacrifício de material que mantém a vantagem |
| **Melhor** | Igual ao melhor lance do motor |
| **Excelente** | Perdeu menos de 20 centipawns |
| **Bom** | Perdeu entre 20 e 49 centipawns |
| **Imprecisão** | Perdeu entre 50 e 99 centipawns |
| **Erro** | Perdeu entre 100 e 199 centipawns |
| **Blunder** | Perdeu 200 centipawns ou mais |

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + Vite + Chessground + Tailwind CSS 4 |
| Backend | FastAPI + python-chess + Stockfish (UCI) |
| IA | Google Gemini API (`gemini-flash-latest`) |
| Persistência | `localStorage` do navegador |
| Testes | pytest (backend) + vitest (frontend) |
| CI | GitHub Actions |

## Como rodar

### 1. Clonar o repositório

```bash
git clone https://github.com/Yurilxm/Chess-coach.git
cd Chess-coach
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
GEMINI_API_KEY=sua-chave-da-gemini
GEMINI_MODEL=gemini-flash-latest
```

Obtenha uma chave gratuita em https://aistudio.google.com/apikey.

### 3. Baixar o Stockfish

O binário **não está no repositório**. Baixe em https://stockfishchess.org/download/ e:

| SO | Procedimento |
|----|--------------|
| Windows | Extraia `stockfish-windows-x86-64-avx2.exe` para `backend/engine/stockfish.exe` |
| macOS | `brew install stockfish` (ajuste `STOCKFISH_PATH` em `backend/config/settings.py`) |
| Linux | `sudo apt install stockfish` (mesmo ajuste) |

### 4. Iniciar com o script (recomendado — Windows)

```powershell
.\dev.ps1
```

O script:

1. Cria o `venv` do backend se não existir
2. Instala `requirements.txt` quando o hash do arquivo muda
3. Instala `node_modules` se não existir
4. Inicia backend (uvicorn --reload) e frontend (vite) em janelas separadas
5. Abre o navegador em http://localhost:5173

Para iniciar sem abrir o navegador:

```powershell
.\dev.ps1 -NoBrowser
```

### 5. Iniciar manualmente

**Backend:**

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cd ..
uvicorn main:app --reload --app-dir backend
```

API em http://localhost:8000 — documentação em http://localhost:8000/docs.

**Frontend** (em outro terminal):

```bash
cd frontend
npm install
npm run dev
```

Aplicação em http://localhost:5173.

## Como usar

1. Abra http://localhost:5173.
2. Escolha um modo:
   - **Jogar** — mova as peças livremente e explore variações.
   - **vs Bot** — escolha sua cor e a dificuldade, jogue contra o Stockfish.
   - **Editor** — monte posições via FEN ou arrastando peças.
   - **Histórico** — veja suas partidas anteriores, com estatísticas completas.
3. Clique em **Analisar posição** para ver a avaliação, os top 3 lances e a explicação da IA.
4. Ao final de uma partida contra o Bot, o modal de **Revisão** aparece com:
   - Resultado, precisão e abertura detectada
   - Contadores clicáveis por categoria (clique para filtrar os lances)
   - Replay lance a lance com o tabuleiro
   - Lista de erros para revisar com explicação do coach (Gemini)
5. As partidas ficam salvas automaticamente no **Histórico**.

## Desenvolvimento

### Rodar todos os testes

Um comando, na raiz do projeto:

```powershell
.\test.ps1
```

Isso roda:

- **Backend** — `pytest` no `backend/venv` (100+ testes)
- **Frontend** — `vitest` em `frontend/` (170+ testes)

Se algum falhar, o script para e mostra o erro.

### Rodar só backend ou só frontend

```bash
# Backend
python -m pytest

# Frontend
cd frontend
npm test
npm run test:watch    # modo watch
cd ..
```

### Estrutura dos testes

**Backend** (`backend/tests/`):

| Arquivo | Cobre |
|---------|-------|
| `conftest.py` | Fixtures compartilhadas (FENs clássicos, partida sintética) |
| `test_classify_move.py` | Classificação de lances (incluindo brilliant/sacrifício) |
| `test_game_rules.py` | Regras de xadrez (xeque-mate, afogamento, material insuficiente) |
| `test_repetition.py` | Detecção de repetição tripla |
| `test_openings.py` | Catálogo de aberturas do bot |
| `test_coach_service.py` | Gemini (mock) |
| `test_stockfish_service.py` | Análise (engine mockada) |
| `test_stockfish_integration.py` | Análise real (pulado se o binário não existir) |
| `test_review_service.py` | Revisão pós-partida |
| `test_review_mate.py` | Casos de borda (mate, lance ilegal, UCI malformado) |
| `test_review_sacrifice.py` | Detecção de sacrifícios |
| `test_api_contract.py` | Contrato dos endpoints via TestClient |

**Frontend** (`frontend/src/`):

| Arquivo | Cobre |
|---------|-------|
| `utils/*.test.js` | Helpers de xadrez, avaliação, tradução de lances, aberturas |
| `hooks/useChessGame*.test.js` | Estado do jogo + premove |
| `hooks/useChessEditor*.test.js` | Estado do editor |
| `hooks/useStockfishAnalysis.test.js` | Chamadas à API |
| `hooks/useMatchHistory.test.js` | Persistência no localStorage |

### Lint e build do frontend

```bash
cd frontend
npm run lint
npm run build
cd ..
```

### CI

A cada push em `main` ou PR, o GitHub Actions roda:

- **Backend** — `pytest` (Ubuntu + Python 3.12)
- **Frontend** — `lint` + `test` + `build` (Ubuntu + Node 20)

Veja o status em https://github.com/Yurilxm/Chess-coach/actions.

## Arquitetura

### Backend (`backend/`)

- **`api/`** — routers HTTP. Todos síncronos (`def`), rodando no threadpool do FastAPI.
- **`services/`** — regras de negócio. `stockfish_service` expõe `engine_analysis()`, wrapper atômico que serializa o acesso à engine com `threading.Lock`.
- **`chess_logic/`** — lógica pura de xadrez (classificação de lances, detecção de sacrifício, regras, repetição, catálogo de aberturas do bot). Sem dependência de HTTP ou engine.
- **`models/`** — schemas Pydantic de request/response.
- **`config/settings.py`** — carrega `.env`, expõe caminho do Stockfish e os 14 níveis de dificuldade.

### Frontend (`frontend/src/`)

- **`hooks/`** — estado da partida. `useChessGame` e `useChessEditor` encapsulam o `chess.js` atrás de uma ref mutável, expondo estado reativo só quando algo muda de fato. `useStockfishAnalysis`, `useBotPlayer`, `useCoach`, `useGameReview` e `useMatchHistory` chamam a API / localStorage.
- **`components/`** — apresentação. `ChessBoard` é totalmente "burro": só espelha props no Chessground. Nada de regra de xadrez aqui.
- **`utils/`** — funções puras (helpers, cálculo de destinos, aberturas ECO, tradução de notação).
- **`utils/apiConfig.js`** — única fonte das URLs da API, lida de `VITE_API_URL`.

### Decisões técnicas

- **Engine persistente com lock.** O Stockfish é um processo caro de iniciar; criar um por request seria lento. Uma instância fica viva, protegida por `threading.Lock`, e `engine_analysis()` garante que duas requests nunca se atropelem.
- **Routers `def` (não `async`).** Como a engine é bloqueante, `async def` travaria o event loop. Com `def`, o FastAPI usa threadpool e o servidor continua responsivo.
- **Detecção de abertura no frontend.** O backend mantém um catálogo próprio só para o bot escolher a linha, sem código ECO. O display (badge durante o jogo, modal de revisão) usa `utils/openings.js` no frontend, com códigos ECO reais (C50, B20...). Uma fonte única para o usuário ver.
- **Sem estado global entre requests.** `get_opening_moves` recebe o histórico completo e decide o próximo lance só com base nele — idempotente, seguro para múltiplos jogadores simultâneos.
- **Histórico em `localStorage`.** Escolha consciente para não exigir backend/migrations. O hook `useMatchHistory` isola o acesso ao storage; trocar por API/SQLite no futuro é só mudar a implementação interna.
- **"Brilhante" por heurística.** Categoria detectada quando o lance deixa uma peça sua pendurada (valor ≥ 3) que não estava pendurada antes, e o `cp_loss` fica abaixo de 30. Não é perfeito como o Chess.com, mas é honesto.
- **Gemini com fallback.** Ao expandir um erro no modal, o coach tenta explicar via Gemini. Se falhar (quota, rede), a explicação heurística local é exibida — sem erro na tela.
- **Análise do review reaproveita `best_cp`.** O `cp_before` de uma iteração é o `best_cp` da anterior (mesma posição). Isso corta ~50% das chamadas à engine no review.

## Estrutura do projeto

```text
chess-coach/
├── backend/
│   ├── api/                # Routers (analyze, coach, play, review)
│   ├── chess_logic/        # Regras puras (classificações, sacrifício, aberturas)
│   ├── config/
│   │   └── settings.py     # Caminho do Stockfish, níveis de dificuldade
│   ├── engine/             # Stockfish.exe (não versionado)
│   ├── models/             # Pydantic schemas
│   ├── services/           # Bot, coach, review, stockfish
│   ├── tests/              # pytest
│   ├── main.py             # Entry point FastAPI
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React (incluindo MatchHistoryView)
│   │   ├── hooks/          # Estado da partida, chamadas à API, histórico
│   │   ├── utils/          # Helpers puros
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example        # Template de VITE_API_URL
│   ├── eslint.config.js
│   ├── vitest.config.js
│   ├── package.json
│   └── vite.config.js
├── .github/workflows/
│   └── test.yml            # CI
├── .env                    # Chaves (não versionado)
├── .gitignore
├── dev.ps1                 # Inicia backend + frontend
├── test.ps1                # Roda pytest + vitest
├── pytest.ini
└── README.md
```

## Licença

Projeto pessoal de estudo. Sinta-se livre para usar e modificar.
