from fastapi import APIRouter
from models.requests import CoachRequest
from models.responses import CoachResponse
from services.coach_service import get_coach_explanation

router = APIRouter()


@router.post("/coach", response_model=CoachResponse)
async def coach(request: CoachRequest):
    if not request.fen or not request.move:
        return {"explanation": "Posição ou lance inválido.", "loading": False}
    explanation = get_coach_explanation(request.fen, request.move, request.evaluation)
    return {"explanation": explanation or "Não foi possível gerar a explicação.", "loading": False}