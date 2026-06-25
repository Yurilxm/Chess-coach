from fastapi import APIRouter
from models.requests import PositionRequest
from models.responses import AnalysisResponse
from services.stockfish_service import analyze_position

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: PositionRequest):
    if not request.fen or "/" not in request.fen:
        return {"fen": request.fen, "best_move": "", "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["FEN inválido."]}
    result = analyze_position(request.fen, history_fens=request.history)
    return {"fen": request.fen, "best_move": result["best_move"] or "", "evaluation": result["evaluation"], "top_moves": result["top_moves"], "lines": result["lines"], "warnings": result.get("warnings", [])}