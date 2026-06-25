from pydantic import BaseModel
from typing import Optional, List
from config.settings import DEFAULT_DIFFICULTY


class PositionRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    history: Optional[List[str]] = None


class PlayRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    difficulty: int = DEFAULT_DIFFICULTY


class CoachRequest(BaseModel):
    fen: str
    move: str
    evaluation: Optional[dict] = None


class ReviewRequest(BaseModel):
    history: list
    player_color: str = 'w'