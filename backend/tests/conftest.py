
"""
Fixtures compartilhadas para todos os testes do backend.

O pytest carrega este arquivo automaticamente antes de qualquer teste
rodar. Qualquer fixture definida aqui fica disponivel em todos os
arquivos de teste sem precisar de import.
"""

import os

# Precisa estar setado ANTES de importar services que criam clients
# no module level (ex: coach_service.py instancia genai.Client no import).
os.environ.setdefault("GEMINI_API_KEY", "test-dummy-key")
os.environ.setdefault("GEMINI_MODEL", "test-dummy-model")

import pytest


# ============================================================
# FENs classicos
# ============================================================

@pytest.fixture
def fen_start():
    """Posicao inicial padrao."""
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


@pytest.fixture
def fen_after_e4():
    """Depois de 1. e4."""
    return "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"


@pytest.fixture
def fen_checkmate():
    """Mate do pastor — vez das pretas, pretas em xeque-mate."""
    return "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4"


@pytest.fixture
def fen_stalemate():
    """Afogamento classico: rei preto em a8 sem lance legal."""
    return "k7/2K5/1Q6/8/8/8/8/8 b - - 0 1"


@pytest.fixture
def fen_insufficient_material():
    """Rei contra rei — material insuficiente."""
    return "8/8/8/4k3/8/4K3/8/8 w - - 0 1"


@pytest.fixture
def fen_invalid():
    """String que nao e um FEN valido."""
    return "isso nao e um FEN valido"


# ============================================================
# Historico de partida (formato usado por review_service)
# ============================================================

@pytest.fixture
def partida_pastor():
    """Mate do pastor completo, lance a lance."""
    return [
        {"from": "e2", "to": "e4", "san": "e4", "color": "w",
         "after": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"},
        {"from": "e7", "to": "e5", "san": "e5", "color": "b",
         "after": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2"},
        {"from": "f1", "to": "c4", "san": "Bc4", "color": "w",
         "after": "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2"},
        {"from": "b8", "to": "c6", "san": "Nc6", "color": "b",
         "after": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3"},
        {"from": "d1", "to": "h5", "san": "Qh5", "color": "w",
         "after": "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3"},
        {"from": "g8", "to": "f6", "san": "Nf6", "color": "b",
         "after": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4"},
        {"from": "h5", "to": "f7", "san": "Qxf7#", "color": "w",
         "captured": "p",
         "after": "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4"},
    ]
