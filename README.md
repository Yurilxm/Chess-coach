# Chess Coach

Treinador pessoal de xadrez com análise do Stockfish, IA (Gemini) e uma Academia de Xadrez interativa.

## Funcionalidades

- **Tabuleiro interativo** com drag and drop, destaque de lances válidos e histórico de jogadas
- **Análise com Stockfish** — top 3 lances recomendados + avaliação da posição
- **Explicações com IA (Gemini)** — cada lance ganha uma explicação em linguagem natural
- **Modo Editor** — monte posições via FEN ou arrastando peças para estudo dirigido
- **Modo Bot** — jogue contra o Stockfish com 14 níveis de dificuldade (rating 200 a 3000)
- **Revisão pós-partida** — relatório completo com precisão, classificação de cada lance e estatísticas
- **Histórico de partidas** — as 50 partidas mais recentes ficam salvas no navegador
- **Academia de Xadrez** — 33 lições interativas divididas em níveis e categorias, incluindo 180 puzzles reais do Lichess (Garfo, Mate em 1 e Mate em 2)
- **Temas Visuais** — escolha a cor do tabuleiro (Oceano, Floresta, etc.) e o estilo das peças (Madeira, Vidro, Vintage)
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
   - **Histórico** — veja suas partidas anteriores.
   - **Academia** — estude fundamentos, táticas e aberturas. Resolva puzzles e acompanhe seu progresso.
   - **Configurações** — mude o tema visual do tabuleiro e das peças.
3. Clique em **Analisar posição** para ver a avaliação, os top 3 lances e a explicação da IA.
4. Ao final de uma partida contra o Bot, o modal de **Revisão** aparece com:
   - Resultado, precisão e abertura detectada
   - Contadores clicáveis por categoria
   - Replay lance a lance com o tabuleiro
   - Lista de erros com explicação do coach (Gemini)

## Desenvolvimento

### Rodar todos os testes

Um comando, na raiz do projeto:

```powershell
.\test.ps1
```

Isso roda:

- **Backend** — `pytest` no `backend/venv` (101 testes)
- **Frontend** — `vitest` em `frontend/` (595 testes)

O frontend inclui o `academyContent.test.js` que varre todos os JSONs da Academia garantindo que FENs e soluções estão corretos.

### Estrutura dos testes

**Backend** (`backend/tests/`): cobre classificação, regras, stockfish, gemini e contrato da API.
**Frontend** (`frontend/src/`): cobre utils, hooks, contextos e **validação de conteúdo da Academia**.

## Arquitetura

### Frontend

- **`contexts/`** — Context API para configurações globais (Temas).
- **`data/academy/`** — Banco de dados em JSON com todas as lições e puzzles.
- **`hooks/`** — Isolam a lógica de estado (jogo, editor, academia, temas).
- **`components/`** — Apresentação (ChessBoard, AcademyView, SettingsView, etc).

### Decisões técnicas

- **Academia 100% Offline:** O conteúdo é compilado junto com o app via Vite (`import.meta.glob`). Nenhuma chamada de API é feita na Academia.
- **Validação Automática de Dados:** Em vez de testar cada lição manualmente, o teste `academyContent.test.js` lê os JSONs e usa o `chess.js` para garantir que o FEN é válido e o lance esperado é legal.
- **Context API para Temas:** O `SettingsContext` evita o "prop drilling" e permite que a mudança de tema afete todos os tabuleiros instantaneamente.
- **Engine persistente com lock:** O Stockfish roda com `threading.Lock` para não travar o event loop do FastAPI.

## Estrutura do projeto

```text
chess-coach/
├── backend/                # API FastAPI + Stockfish + Testes
├── frontend/
│   ├── src/
│   │   ├── components/     # UI React (AcademyView, SettingsView, etc)
│   │   ├── contexts/       # SettingsContext (Temas)
│   │   ├── data/academy/   # Lições em JSON
│   │   ├── hooks/          # useAcademy, useLesson, useChessGame, etc
│   │   └── utils/          # lessonValidator, chessHelpers, etc
│   └── ...
├── dev.ps1                 # Script de inicialização
├── test.ps1                # Script de testes
└── README.md
```

## Licença

Projeto pessoal de estudo. Sinta-se livre para usar e modificar.
