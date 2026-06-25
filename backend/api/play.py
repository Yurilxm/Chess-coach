from fastapi import APIRouter
from models.requests import PlayRequest
from models.responses import PlayResponse
from services.bot_service import play_bot_move

router = APIRouter()


@router.post("/play", response_model=PlayResponse)
async def play(request: PlayRequest):
    result = play_bot_move(request.fen, request.difficulty)
    if result is None:
        return {"fen": request.fen, "move": "", "from_square": "", "to_square": "", "promotion": None}
    return {"fen": request.fen, "move": result["move"], "from_square": result["from_square"], "to_square": result["to_square"], "promotion": result["promotion"]}