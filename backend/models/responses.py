from pydantic import BaseModel
from typing import Optional


class AnalysisResponse(BaseModel):
    fen: str
    best_move: str
    evaluation: dict
    top_moves: list
    lines: list = []
    warnings: list = []


class PlayResponse(BaseModel):
    fen: str
    move: str
    from_square: str
    to_square: str
    promotion: Optional[str] = None


class CoachResponse(BaseModel):
    explanation: str
    loading: bool = False


class ReviewResponse(BaseModel):
    result: str
    result_reason: str = ""
    opening: dict
    stats: dict
    mistakes: list
    summary: str
    loading: bool = False