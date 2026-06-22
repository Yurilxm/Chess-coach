from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stockfish import Stockfish, StockfishException
import os

app = FastAPI(title="Chess Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
STOCKFISH_PATH = os.path.join(BASE_DIR, "engine", "stockfish.exe")

ANALYSIS_DEPTH = 15
MULTI_PV = 3


class PositionRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


class AnalysisResponse(BaseModel):
    fen: str
    best_move: str
    evaluation: dict
    top_moves: list
    lines: list = []  # NOVO: avaliação real de cada uma das N melhores linhas


def analyze_with_stockfish(fen: str, depth: int = ANALYSIS_DEPTH, multi_pv: int = MULTI_PV):
    """
    Usa a biblioteca `stockfish` (já estava no requirements.txt, mas não
    era usada) em vez de conversar com o processo "na mão" via subprocess.
    Isso corrige dois problemas reais que existiam antes:

    1) `top_moves` pegava os 3 primeiros lances da MESMA linha principal
       (ex: e2e4, depois e7e5, depois g1f3 — uma sequência hipotética),
       e não 3 lances alternativos de verdade pro lance atual. Por isso
       a "2ª opção" podia ser ilegal na posição exibida. Com MultiPV, o
       motor calcula N linhas DISTINTAS e independentes, cada uma com
       sua própria avaliação.

    2) O protocolo UCI cru devolve o "cp" relativo a quem tem a vez de
       jogar, não relativo às brancas. Sem normalizar isso, quando é a
       vez das pretas um valor positivo na verdade significa vantagem
       das PRETAS — mas o frontend sempre interpretou positivo como
       vantagem das brancas. `set_turn_perspective(False)` corrige isso
       na origem.
    """
    engine = None
    try:
        engine = Stockfish(path=STOCKFISH_PATH, depth=depth, parameters={
            "MultiPV": multi_pv,
            "Threads": 2,
            "Hash": 128,
        })
        engine.set_turn_perspective(False)

        if not engine.is_fen_valid(fen):
            return {
                "best_move": None,
                "evaluation": {"type": "cp", "value": 0},
                "top_moves": [],
                "lines": [],
            }

        engine.set_fen_position(fen)
        top = engine.get_top_moves(multi_pv)

        lines = []
        for entry in top:
            move = entry.get("Move")
            if not move:
                continue
            if entry.get("Mate") is not None:
                evaluation = {"type": "mate", "value": entry["Mate"]}
            else:
                evaluation = {"type": "cp", "value": entry.get("Centipawn") or 0}
            lines.append({"move": move, "evaluation": evaluation})

        if not lines:
            # Sem lances legais (xeque-mate ou afogamento): get_top_moves
            # devolve lista vazia nesse caso.
            return {
                "best_move": None,
                "evaluation": {"type": "cp", "value": 0},
                "top_moves": [],
                "lines": [],
            }

        return {
            "best_move": lines[0]["move"],
            "evaluation": lines[0]["evaluation"],
            "top_moves": [line["move"] for line in lines],
            "lines": lines,
        }

    except StockfishException as e:
        print(f"Stockfish travou com esta posição: {e}")
        return {
            "best_move": None,
            "evaluation": {"type": "cp", "value": 0},
            "top_moves": [],
            "lines": [],
        }
    except Exception as e:
        print(f"Erro inesperado na análise: {e}")
        return {
            "best_move": None,
            "evaluation": {"type": "cp", "value": 0},
            "top_moves": [],
            "lines": [],
        }
    finally:
        # __del__ chamaria send_quit_command() sozinho eventualmente, mas
        # o Python não garante QUANDO isso aconteceria — então fechamos
        # o processo do motor explicitamente aqui.
        if engine is not None:
            try:
                engine.send_quit_command()
            except Exception:
                pass


@app.get("/")
async def root():
    return {"message": "Chess Coach API", "status": "running"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_position(request: PositionRequest):
    # FEN básico válido sempre
    if not request.fen or "/" not in request.fen:
        return {
            "fen": request.fen,
            "best_move": "",
            "evaluation": {"type": "cp", "value": 0},
            "top_moves": [],
            "lines": [],
        }

    result = analyze_with_stockfish(request.fen)

    return {
        "fen": request.fen,
        "best_move": result["best_move"] or "",
        "evaluation": result["evaluation"],
        "top_moves": result["top_moves"],
        "lines": result["lines"],
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "stockfish_path": STOCKFISH_PATH}