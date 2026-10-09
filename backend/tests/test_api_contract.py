
"""
Testes de contrato dos endpoints da API (FastAPI TestClient).

Todos os services sao mockados. Nenhuma chamada real ao Stockfish
ou ao Gemini acontece aqui.
"""

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


# ------------------------------------------------------------
# Endpoints publicos (sem mock)
# ------------------------------------------------------------

def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "running"
    assert "Chess Coach API" in body["message"]


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "stockfish_exists" in body
    assert isinstance(body["stockfish_exists"], bool)


# ------------------------------------------------------------
# POST /analyze
# ------------------------------------------------------------

def test_analyze_fen_valido(client, monkeypatch, fen_start):
    fake_result = {
        "best_move": "e2e4",
        "evaluation": {"type": "cp", "value": 30},
        "top_moves": ["e2e4", "d2d4"],
        "lines": [
            {"move": "e2e4", "evaluation": {"type": "cp", "value": 30}},
            {"move": "d2d4", "evaluation": {"type": "cp", "value": 20}},
        ],
        "warnings": [],
    }
    monkeypatch.setattr("api.analyze.analyze_position", lambda *a, **k: fake_result)

    r = client.post("/analyze", json={"fen": fen_start})

    assert r.status_code == 200
    body = r.json()
    assert body["fen"] == fen_start
    assert body["best_move"] == "e2e4"
    assert body["evaluation"] == {"type": "cp", "value": 30}
    assert len(body["lines"]) == 2


def test_analyze_fen_vazio_nao_chama_engine(client, monkeypatch):
    def explode(*a, **k):
        raise AssertionError("Nao deveria chamar analyze_position com FEN vazio")
    monkeypatch.setattr("api.analyze.analyze_position", explode)

    r = client.post("/analyze", json={"fen": ""})

    assert r.status_code == 200
    body = r.json()
    assert body["best_move"] == ""
    assert "FEN inválido." in body["warnings"]


def test_analyze_fen_sem_barra_nao_chama_engine(client, monkeypatch):
    def explode(*a, **k):
        raise AssertionError("Nao deveria chamar analyze_position com FEN invalido")
    monkeypatch.setattr("api.analyze.analyze_position", explode)

    r = client.post("/analyze", json={"fen": "abc"})

    assert r.status_code == 200
    body = r.json()
    assert "FEN inválido." in body["warnings"]


# ------------------------------------------------------------
# POST /coach
# ------------------------------------------------------------

def test_coach_basico(client, monkeypatch, fen_start):
    monkeypatch.setattr(
        "api.coach.get_coach_explanation",
        lambda fen, move, evaluation=None: "Explicacao fake do lance.",
    )

    r = client.post("/coach", json={"fen": fen_start, "move": "e2e4"})

    assert r.status_code == 200
    body = r.json()
    assert body["explanation"] == "Explicacao fake do lance."
    assert body["loading"] is False


def test_coach_fen_vazio(client):
    r = client.post("/coach", json={"fen": "", "move": "e2e4"})
    assert r.status_code == 200
    body = r.json()
    assert "inválido" in body["explanation"].lower() or "inválido" in body["explanation"]


def test_coach_service_retorna_none(client, monkeypatch, fen_start):
    monkeypatch.setattr("api.coach.get_coach_explanation", lambda *a, **k: None)

    r = client.post("/coach", json={"fen": fen_start, "move": "e2e4"})
    assert r.status_code == 200
    body = r.json()
    assert "Não foi possível" in body["explanation"]


# ------------------------------------------------------------
# POST /play
# ------------------------------------------------------------

def test_play_basico(client, monkeypatch, fen_start):
    fake = {
        "move": "e7e5",
        "from_square": "e7",
        "to_square": "e5",
        "promotion": None,
    }
    monkeypatch.setattr("api.play.play_bot_move", lambda fen, diff: fake)

    r = client.post("/play", json={"fen": fen_start, "difficulty": 1000})

    assert r.status_code == 200
    body = r.json()
    assert body["move"] == "e7e5"
    assert body["from_square"] == "e7"
    assert body["to_square"] == "e5"


def test_play_bot_falha_retorna_vazio(client, monkeypatch, fen_start):
    monkeypatch.setattr("api.play.play_bot_move", lambda fen, diff: None)

    r = client.post("/play", json={"fen": fen_start, "difficulty": 1000})
    assert r.status_code == 200
    body = r.json()
    assert body["move"] == ""
    assert body["from_square"] == ""
    assert body["to_square"] == ""


# ------------------------------------------------------------
# POST /review
# ------------------------------------------------------------

def test_review_basico(client, monkeypatch, partida_pastor):
    fake = {
        "result": "Vitória",
        "result_reason": "Xeque-mate",
        "stats": {
            "total_moves": 7, "captures_by_player": 1, "captures_by_opponent": 0,
            "accuracy": 85.0, "brilliant": 0, "best_moves": 3, "excellent": 1,
            "good": 0, "inaccuracies": 0, "mistakes": 0, "blunders": 0,
            "grave_mistakes": 0, "moderate_mistakes": 0,
        },
        "mistakes": [],
        "all_moves": [],
        "summary": "Resumo fake.",
    }
    monkeypatch.setattr("api.review.review_game", lambda h, c: fake)

    r = client.post("/review", json={"history": partida_pastor, "player_color": "w"})

    assert r.status_code == 200
    body = r.json()
    assert body["result"] == "Vitória"
    assert body["stats"]["accuracy"] == 85.0


def test_review_service_retorna_none(client, monkeypatch):
    monkeypatch.setattr("api.review.review_game", lambda h, c: None)

    r = client.post("/review", json={"history": [{"a": 1}], "player_color": "w"})
    assert r.status_code == 200
    body = r.json()
    assert body["result"] == "Erro"
    assert "Não foi possível" in body["summary"]
