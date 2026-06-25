from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from config.settings import STOCKFISH_PATH

from api.analyze import router as analyze_router
from api.play import router as play_router
from api.coach import router as coach_router
from api.review import router as review_router

app = FastAPI(title="Chess Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(play_router)
app.include_router(coach_router)
app.include_router(review_router)


@app.get("/")
async def root():
    return {"message": "Chess Coach API", "status": "running", "version": "3.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "stockfish_exists": os.path.exists(STOCKFISH_PATH)}