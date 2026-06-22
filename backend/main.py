from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stockfish import Stockfish, StockfishException
from typing import Optional
import os

app = FastAPI(title="Chess Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
STOCKFISH_PATH = os.path.join(BASE_DIR, "engine", "stockfish.exe")

ANALYSIS_DEPTH = 15
MULTI_PV = 3

# ELO mínimo do Stockfish é 1320
DIFFICULTY_LEVELS = {
    "beginner":     {"elo": 1350, "skill": 0,  "depth": 5},
    "casual":       {"elo": 1500, "skill": 5,  "depth": 8},
    "intermediate": {"elo": 1800, "skill": 10, "depth": 12},
    "advanced":     {"elo": 2100, "skill": 15, "depth": 15},
    "expert":       {"elo": 2500, "skill": 20, "depth": 18},
    "stockfish":    {"elo": 3000, "skill": 20, "depth": 22},
}


class PositionRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


class PlayRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    difficulty: str = "intermediate"


class AnalysisResponse(BaseModel):
    fen: str
    best_move: str
    evaluation: dict
    top_moves: list
    lines: list = []


class PlayResponse(BaseModel):
    fen: str
    move: str
    from_square: str
    to_square: str
    promotion: Optional[str] = None  # CORRIGIDO: Optional[str]


def get_engine(depth=ANALYSIS_DEPTH, multi_pv=MULTI_PV, skill=None, elo=None):
    """Cria e configura uma instância do Stockfish."""
    params = {
        "MultiPV": multi_pv,
        "Threads": 2,
        "Hash": 128,
    }
    if skill is not None:
        params["Skill Level"] = skill
    if elo is not None:
        params["UCI_Elo"] = elo
        params["UCI_LimitStrength"] = True
    
    engine = Stockfish(path=STOCKFISH_PATH, depth=depth, parameters=params)
    engine.set_turn_perspective(False)
    return engine


def analyze_with_stockfish(fen: str, depth: int = ANALYSIS_DEPTH, multi_pv: int = MULTI_PV):
    engine = None
    try:
        engine = get_engine(depth=depth, multi_pv=multi_pv)

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
        if engine is not None:
            try:
                engine.send_quit_command()
            except Exception:
                pass


def play_bot_move(fen: str, difficulty: str = "intermediate"):
    """Obtém o melhor lance do bot para a posição dada."""
    config = DIFFICULTY_LEVELS.get(difficulty, DIFFICULTY_LEVELS["intermediate"])
    
    engine = None
    try:
        engine = get_engine(
            depth=config["depth"],
            multi_pv=1,
            skill=config["skill"],
            elo=config["elo"]
        )

        if not engine.is_fen_valid(fen):
            print(f"FEN inválido: {fen}")
            return None

        engine.set_fen_position(fen)
        best_move = engine.get_best_move()

        if not best_move or len(best_move) < 4:
            print(f"Sem lances disponíveis para: {fen}")
            return None

        from_sq = best_move[:2]
        to_sq = best_move[2:4]
        promotion = best_move[4] if len(best_move) > 4 else None

        return {
            "move": best_move,
            "from_square": from_sq,
            "to_square": to_sq,
            "promotion": promotion,
        }

    except Exception as e:
        print(f"Erro ao jogar como bot: {e}")
        return None
    finally:
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


@app.post("/play", response_model=PlayResponse)
async def play(request: PlayRequest):
    result = play_bot_move(request.fen, request.difficulty)
    
    if result is None:
        return {
            "fen": request.fen,
            "move": "",
            "from_square": "",
            "to_square": "",
            "promotion": None,
        }
    
    return {
        "fen": request.fen,
        "move": result["move"],
        "from_square": result["from_square"],
        "to_square": result["to_square"],
        "promotion": result["promotion"],
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "stockfish_path": STOCKFISH_PATH}