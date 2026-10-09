from fastapi import APIRouter
from models.requests import ReviewRequest
from models.responses import ReviewResponse
from services.review_service import review_game

router = APIRouter()


@router.post("/review", response_model=ReviewResponse)
async def review(request: ReviewRequest):
    result = review_game(request.history, request.player_color)
    if result is None:
        return {
            "result": "Erro", "result_reason": "",
            "stats": {}, "mistakes": [], "all_moves": [], "summary": "Não foi possível analisar.", "loading": False,
        }
    return {
        "result": result["result"], "result_reason": result.get("result_reason", ""),
        "stats": result["stats"],
        "mistakes": result["mistakes"], "all_moves": result.get("all_moves", []),
        "summary": result["summary"], "loading": False,
    }