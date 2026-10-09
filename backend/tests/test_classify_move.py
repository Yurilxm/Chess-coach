
"""
Testes para chess_logic/classifications.py — funcao classify_move.
"""

from chess_logic.classifications import classify_move


def test_best_move():
    assert classify_move("e2e4", "e2e4", 0, True) == "best"


def test_excellent():
    assert classify_move("e2e4", "d2d4", 10, True) == "excellent"


def test_good():
    assert classify_move("e2e4", "d2d4", 30, True) == "good"


def test_inaccuracy():
    assert classify_move("e2e4", "d2d4", 70, True) == "inaccuracy"


def test_mistake():
    assert classify_move("e2e4", "d2d4", 150, True) == "mistake"


def test_blunder():
    assert classify_move("e2e4", "d2d4", 250, True) == "blunder"


def test_opponent_move():
    assert classify_move("e2e4", "d2d4", 500, False) == "opponent"


def test_threshold_20_is_good():
    assert classify_move("e2e4", "d2d4", 20, True) == "good"


def test_threshold_50_is_inaccuracy():
    assert classify_move("e2e4", "d2d4", 50, True) == "inaccuracy"


def test_threshold_100_is_mistake():
    assert classify_move("e2e4", "d2d4", 100, True) == "mistake"


def test_threshold_200_is_blunder():
    assert classify_move("e2e4", "d2d4", 200, True) == "blunder"


def test_cp_loss_negativo_e_tratado_como_absoluto():
    assert classify_move("e2e4", "d2d4", -30, True) == "good"


def test_best_move_vazio_retorna_best():
    # BUG CONHECIDO: comportamento atual documentado.
    # Quando corrigido, este teste deve ser atualizado.
    assert classify_move("", "", 0, True) == "best"
