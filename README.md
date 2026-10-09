# Chess Coach

Treinador pessoal de xadrez com analise do Stockfish e explicacoes com IA (Gemini).

## Funcionalidades

- **Tabuleiro interativo** com drag and drop, destaque de lances validos e historico de jogadas
- **Analise com Stockfish** — top 3 lances recomendados + avaliacao da posicao
- **Explicacoes com IA (Gemini)** — cada lance ganha uma explicacao em linguagem natural
- **Modo Editor** — monte posicoes via FEN ou arrastando pecas para estudo dirigido
- **Modo Bot** — jogue contra o Stockfish com 14 niveis de dificuldade (rating 200 a 3000)
- **Revisao pos-partida** — relatorio completo com precisao, erros, imprecisoes e estatisticas
- **Pre-jogadas** — fila de lances planejados enquanto o bot pensa

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + Vite + Chessground + Tailwind CSS 4 |
| Backend | FastAPI + python-chess + Stockfish (UCI) |
| IA | Google Gemini API (gemini-flash-latest) |
| Testes | pytest (backend) + vitest (frontend) |
| CI | GitHub Actions |

## Como rodar

### 1. Clonar o repositorio

```bash
git clone https://github.com/Yurilxm/Chess-coach.git
cd Chess-coach
```

### 2. Configurar variaveis de ambiente

Crie um arquivo .env na raiz do projeto:

```env
GEMINI_API_KEY=sua-chave-da-gemini
GEMINI_MODEL=gemini-flash-latest
```

Obtenha uma chave gratuita em https://aistudio.google.com/apikey.

### 3. Baixar o Stockfish

O binario **nao esta no repositorio**. Baixe em https://stockfishchess.org/download/ e:

| SO | Procedimento |
|----|--------------|
| Windows | Extraia stockfish-windows-x86-64-avx2.exe para backend/engine/stockfish.exe |
| macOS | brew install stockfish (ajuste STOCKFISH_PATH em backend/config/settings.py) |
| Linux | sudo apt install stockfish (mesmo ajuste) |

### 4. Iniciar com o script (recomendado — Windows)

```powershell
.\dev.ps1
```

O script:

1. Cria o venv do backend se nao existir
2. Instala requirements.txt quando o hash do arquivo muda
3. Instala node_modules se nao existir
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

API em http://localhost:8000 — documentacao em http://localhost:8000/docs.

**Frontend** (em outro terminal):

```bash
cd frontend
npm install
npm run dev
```

Aplicacao em http://localhost:5173.

## Como usar

1. Abra http://localhost:5173.
2. Escolha um modo:
   - **Jogar** — mova as pecas livremente e explore variacoes.
   - **vs Bot** — escolha sua cor e a dificuldade, jogue contra o Stockfish.
   - **Editor** — monte posicoes via FEN ou arrastando pecas.
3. Clique em **Analisar posicao** para ver a avaliacao, os top 3 lances e a explicacao da IA.
4. Ao final de uma partida contra o Bot, o modal de **Revisao** aparece com estatisticas completas.

## Desenvolvimento

### Rodar todos os testes

Um comando, na raiz do projeto:

```powershell
.\test.ps1
```

Isso roda:

- **Backend** — pytest no backend/venv (~75 testes)
- **Frontend** — vitest em frontend/ (~122 testes)

Se algum falhar, o script para e mostra o erro.

### Rodar so backend ou so frontend

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

**Backend** (backend/tests/):

| Arquivo | Cobre |
|---------|-------|
| conftest.py | Fixtures compartilhadas (FENs classicos, partida sintetica) |
| test_classify_move.py | Classificacao de lances (best, excellent, mistake, blunder...) |
| test_game_rules.py | Regras de xadrez (xeque-mate, afogamento, material insuficiente) |
| test_repetition.py | Deteccao de repeticao tripla |
| test_openings.py | Catalogo de aberturas do bot |
| test_coach_service.py | Gemini (mock) |
| test_stockfish_service.py | Analise (engine mockada) |
| test_stockfish_integration.py | Analise real (pulado se o binario nao existir) |
| test_review_service.py | Revisao pos-partida |
| test_api_contract.py | Contrato dos endpoints via TestClient |

**Frontend** (frontend/src/):

| Arquivo | Cobre |
|---------|-------|
| utils/*.test.js | Helpers de xadrez, avaliacao, traducao de lances, aberturas |
| hooks/*.test.js | useChessGame, useChessEditor, useStockfishAnalysis |

### Lint e build do frontend

```bash
cd frontend
npm run lint
npm run build
cd ..
```

### CI

A cada push em main ou PR, o GitHub Actions roda:

- **Backend** — pytest (Ubuntu + Python 3.12)
- **Frontend** — lint + test + build (Ubuntu + Node 20)

Veja o status em https://github.com/Yurilxm/Chess-coach/actions.

## Arquitetura

### Backend (backend/)

- **api/** — routers HTTP. Todos sincronos (def), rodando no threadpool do FastAPI.
- **services/** — regras de negocio. stockfish_service expoe engine_analysis(), um wrapper atomico que serializa o acesso a engine com threading.Lock.
- **chess_logic/** — logica pura de xadrez (classificacao de lances, regras, repeticao, catalogo de aberturas do bot). Sem dependencia de HTTP ou engine.
- **models/** — schemas Pydantic de request/response.
- **config/settings.py** — carrega .env, expoe caminho do Stockfish e os 14 niveis de dificuldade.

### Frontend (frontend/src/)

- **hooks/** — estado da partida. useChessGame e useChessEditor encapsulam o chess.js atras de uma ref mutavel, expondo estado reativo so quando algo muda de fato. useStockfishAnalysis, useBotPlayer, useCoach e useGameReview chamam a API e gerenciam loading/erro.
- **components/** — apresentacao. ChessBoard e totalmente burro: so espelha props no Chessground. Nada de regra de xadrez aqui.
- **utils/** — funcoes puras (helpers, calculo de destinos, aberturas ECO, traducao de notacao).
- **utils/apiConfig.js** — unica fonte das URLs da API, lida de VITE_API_URL.

### Decisoes tecnicas

- **Engine persistente com lock.** O Stockfish e um processo caro de iniciar; criar um por request seria lento. Uma instancia fica viva, protegida por threading.Lock, e engine_analysis() garante que duas requests nunca se atropelem.
- **Routers def (nao async).** Como a engine e bloqueante, async def travaria o event loop. Com def, o FastAPI usa threadpool e o servidor continua responsivo.
- **Deteccao de abertura no frontend.** O backend mantem um catalogo proprio so para o bot escolher a linha, sem codigo ECO. O display (badge durante o jogo, modal de revisao) usa utils/openings.js no frontend, com codigos ECO reais (C50, B20...). Uma fonte unica para o usuario ver.
- **Sem estado global entre requests.** get_opening_moves recebe o historico completo e decide o proximo lance so com base nele — idempotente, seguro para multiplos jogadores simultaneos.

## Estrutura do projeto

```text
chess-coach/
├── backend/
│   ├── api/                # Routers (analyze, coach, play, review)
│   ├── chess_logic/        # Regras puras (classificacoes, repeticao, aberturas)
│   ├── config/
│   │   └── settings.py     # Caminho do Stockfish, niveis de dificuldade
│   ├── engine/             # Stockfish.exe (nao versionado)
│   ├── models/             # Pydantic schemas
│   ├── services/           # Bot, coach, review, stockfish
│   ├── tests/              # pytest
│   ├── main.py             # Entry point FastAPI
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Hooks (estado da partida, chamadas a API)
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
├── .env                    # Chaves (nao versionado)
├── .gitignore
├── dev.ps1                 # Inicia backend + frontend
├── test.ps1                # Roda pytest + vitest
├── pytest.ini
└── README.md
```

## Licenca

Projeto pessoal de estudo. Sinta-se livre para usar e modificar.
