from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import time

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

class PositionRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

class AnalysisResponse(BaseModel):
    fen: str
    best_move: str
    evaluation: dict
    top_moves: list

def analyze_with_stockfish(fen: str, depth: int = 15):
    try:
        stockfish = subprocess.Popen(
            STOCKFISH_PATH,
            universal_newlines=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        commands = [
            "uci",
            "setoption name UCI_AnalyseMode value true",
            f"position fen {fen}",
            f"go depth {depth}"
        ]

        for cmd in commands:
            stockfish.stdin.write(cmd + "\n")
            stockfish.stdin.flush()

        best_move = None
        evaluation = {"type": "cp", "value": 0}
        top_moves = []

        while True:
            line = stockfish.stdout.readline().strip()
            
            if line.startswith("bestmove"):
                parts = line.split()
                best_move = parts[1] if len(parts) > 1 else None
                break
            
            elif line.startswith("info") and "score" in line:
                if "mate" in line:
                    idx = line.find("mate")
                    value = line[idx:].split()[1]
                    evaluation = {"type": "mate", "value": int(value)}
                elif "cp" in line:
                    idx = line.find("cp")
                    value = line[idx:].split()[1]
                    evaluation = {"type": "cp", "value": int(value)}
                
                # NOVA EXTRAÇÃO DE TOP MOVES
                if "pv" in line:
                    parts = line.split(" pv ")
                    if len(parts) > 1:
                        moves = parts[1].split()[:3]
                        if f"depth {depth}" in line:
                            top_moves = moves

        stockfish.terminate()
        
        return {
            "best_move": best_move,
            "evaluation": evaluation,
            "top_moves": top_moves if top_moves else [best_move] if best_move else []
        }

    except Exception as e:
        print(f"Erro Stockfish: {e}")
        return {
            "best_move": None,
            "evaluation": {"type": "cp", "value": 0},
            "top_moves": []
        }

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
            "top_moves": []
        }
    
    result = analyze_with_stockfish(request.fen)
    
    return {
        "fen": request.fen,
        "best_move": result["best_move"] or "",
        "evaluation": result["evaluation"],
        "top_moves": result["top_moves"]
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "stockfish_path": STOCKFISH_PATH}