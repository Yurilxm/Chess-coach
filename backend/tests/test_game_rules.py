
"""
Testes para chess_logic/game_rules.py — funcao get_position_info(fen).

Retorna dict com informacoes da posicao, ou None se o FEN for invalido.
"""

from chess_logic.game_rules import get_position_info


# ------------------------------------------------------------
# Posicao inicial
# ------------------------------------------------------------

def test_posicao_inicial_turno_brancas(fen_start):
    info = get_position_info(fen_start)
    assert info is not None
    assert info["turn"] == "white"
    assert info["is_check"] is False
    assert info["is_checkmate"] is False
    assert info["is_stalemate"] is False
    assert info["is_game_over"] is False


def test_posicao_inicial_contadores(fen_start):
    info = get_position_info(fen_start)
    assert info["fullmove_number"] == 1
    assert info["halfmove_clock"] == 0


def test_posicao_apos_e4_turno_pretas(fen_after_e4):
    info = get_position_info(fen_after_e4)
    assert info is not None
    assert info["turn"] == "black"


# ------------------------------------------------------------
# Fim de jogo
# ------------------------------------------------------------

def test_xeque_mate(fen_checkmate):
    info = get_position_info(fen_checkmate)
    assert info is not None
    assert info["is_checkmate"] is True
    assert info["is_game_over"] is True
    assert info["is_check"] is True
    assert info["turn"] == "black"


def test_afogamento(fen_stalemate):
    info = get_position_info(fen_stalemate)
    assert info is not None
    assert info["is_stalemate"] is True
    assert info["is_game_over"] is True
    assert info["is_check"] is False


def test_material_insuficiente(fen_insufficient_material):
    info = get_position_info(fen_insufficient_material)
    assert info is not None
    assert info["is_insufficient_material"] is True
    assert info["is_game_over"] is True


# ------------------------------------------------------------
# Casos de borda
# ------------------------------------------------------------

def test_fen_invalido_retorna_none(fen_invalid):
    """FEN invalido deve retornar None (comportamento atual do except)."""
    assert get_position_info(fen_invalid) is None


def test_retorna_todas_as_chaves_esperadas(fen_start):
    """Garante que o contrato da funcao nao muda silenciosamente."""
    info = get_position_info(fen_start)
    chaves_esperadas = {
        "is_check", "is_checkmate", "is_stalemate",
        "is_insufficient_material", "is_game_over",
        "fullmove_number", "halfmove_clock", "turn",
        "can_claim_threefold", "can_claim_fifty_moves",
    }
    assert chaves_esperadas.issubset(info.keys())
