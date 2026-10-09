"""Testes para chess_logic/classifications.py."""

import chess
import pytest
from chess_logic.classifications import (
    classify_move,
    is_hanging,
    count_hanging_pieces,
    PIECE_VALUES,
)


# ------------------------------------------------------------
# Categorias basicas (jogador)
# ------------------------------------------------------------

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


# ------------------------------------------------------------
# Brilhante (is_sacrifice)
# ------------------------------------------------------------

def test_brilliant_sacrifice_com_avaliacao_preservada():
    """Sacrificio com cp_loss pequeno vira 'brilliant'."""
    assert classify_move("e2e4", "d2d4", 10, True, is_sacrifice=True) == "brilliant"


def test_brilliant_tem_prioridade_sobre_best():
    """Se for sacrificio E for o melhor lance, e brilliant."""
    assert classify_move("e2e4", "e2e4", 0, True, is_sacrifice=True) == "brilliant"


def test_sacrifice_com_cp_loss_grande_nao_e_brilliant():
    """Sacrificio ruim (perdeu muita vantagem) nao vira brilliant."""
    result = classify_move("e2e4", "d2d4", 200, True, is_sacrifice=True)
    assert result != "brilliant"


def test_is_sacrifice_default_false():
    """Sem passar is_sacrifice, comportamento antigo."""
    assert classify_move("e2e4", "e2e4", 0, True) == "best"


# ------------------------------------------------------------
# Fronteiras dos limiares
# ------------------------------------------------------------

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
    assert classify_move("", "", 0, True) == "best"


# ------------------------------------------------------------
# is_hanging / count_hanging_pieces
# ------------------------------------------------------------

def test_peca_nao_atacada_nao_esta_pendurada():
    # Posicao inicial: nada pendurado
    board = chess.Board()
    assert is_hanging(board, chess.E2) is False


def test_peao_atacado_nao_conta():
    """Peoes (valor 1) nao contam como pendurados por padrao."""
    # Peao branco em d4 atacado por peao preto em e5
    board = chess.Board("4k3/8/8/4p3/3P4/8/8/4K3 w - - 0 1")
    assert is_hanging(board, chess.D4) is False


def test_torre_pendurada_sem_defesa():
    """Torre atacada por bispo = pendurada (bispo=3 < torre=5)."""
    # Torre branca em e5, bispo preto em c3, reis distantes
    board = chess.Board("4k3/8/8/4R3/8/2b5/8/4K3 w - - 0 1")
    assert is_hanging(board, chess.E5) is True


def test_pecas_de_mesmo_valor_nao_sao_penduradas():
    """Cavalo (3) atacado por bispo (3): troca neutra, nao e pendurado."""
    board = chess.Board("4k3/8/8/4N3/8/2b5/8/4K3 w - - 0 1")
    assert is_hanging(board, chess.E5) is False


def test_rei_nunca_conta_como_pendurado():
    """Rei atacado nao e peca pendurada — e xeque. Sempre False."""
    # Rei branco em e1 atacado por bispo preto em c3 (diagonal c3-d2-e1)
    board = chess.Board("4k3/8/8/4N3/8/2b5/8/4K3 w - - 0 1")
    assert is_hanging(board, chess.E1) is False


def test_count_hanging_ignora_rei():
    """So 1 peca pendurada (torre em e5). Rei em e1 tambem e atacado,
    mas nao conta."""
    board = chess.Board("4k3/8/8/4R3/8/2b5/8/4K3 w - - 0 1")
    assert count_hanging_pieces(board, chess.WHITE) == 1


def test_dama_pendurada_sem_defesa():
    """Dama atacada por peao e sem defesa = pendurada."""
    board = chess.Board("4k3/8/8/3p4/4Q3/8/8/4K3 w - - 0 1")
    assert is_hanging(board, chess.E4) is True


def test_count_hanging_pieces_posicao_inicial():
    """Posicao inicial: nada pendurado dos dois lados."""
    board = chess.Board()
    assert count_hanging_pieces(board, chess.WHITE) == 0
    assert count_hanging_pieces(board, chess.BLACK) == 0


def test_count_hanging_pieces_detecta_uma_torre():
    """Conta 1 peca pendurada (torre em e5)."""
    board = chess.Board("4k3/8/8/4R3/8/2b5/8/4K3 w - - 0 1")
    assert count_hanging_pieces(board, chess.WHITE) == 1
