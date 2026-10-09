
"""
Testes para chess_logic/repetition.py — funcao check_repetition_danger.

Retorna lista de lances (UCI) que, a partir da posicao atual, levariam
a uma posicao que ja apareceu 3+ vezes (repeticao tripla).
"""

from chess_logic.repetition import check_repetition_danger


# ------------------------------------------------------------
# Casos de borda
# ------------------------------------------------------------

def test_lista_vazia_retorna_vazio(fen_start):
    assert check_repetition_danger(fen_start, []) == []


def test_lista_none_retorna_vazio(fen_start):
    assert check_repetition_danger(fen_start, None) == []


def test_lista_curta_retorna_vazio(fen_start):
    """Menos de 4 FENs no historico: nao da pra ter repeticao tripla."""
    curto = [fen_start, fen_start, fen_start]
    assert check_repetition_danger(fen_start, curto) == []


def test_fen_invalido_retorna_vazio(fen_invalid):
    """FEN invalido e capturado pelo except e retorna lista vazia."""
    historico = [f"fake{i}" for i in range(5)]
    assert check_repetition_danger(fen_invalid, historico) == []


# ------------------------------------------------------------
# Sem repeticao perigosa
# ------------------------------------------------------------

def test_historico_sem_repeticao(fen_start, fen_after_e4):
    """
    Historico em que a posicao atual nao aparece. count fica em 1 (< 2),
    retorna lista vazia mesmo com historico longo.
    """
    historico = [fen_after_e4, fen_after_e4, fen_after_e4, fen_after_e4]
    assert check_repetition_danger(fen_start, historico) == []


# ------------------------------------------------------------
# Repeticao tripla detectada
# ------------------------------------------------------------

def test_repeticao_tripla_detectada():
    """
    Cenario construido manualmente:

    - Posicao A = apos 1.e4 e5
    - Posicao B = apos 1.e4 e5 2.Nf3

    Historico contem: [A, B, B, A]
    Posicao atual: A. Entao A aparece 2x no historico + 1x atual = 3.

    A partir de A, o lance g1f3 leva a B. B aparece 2x no historico,
    entao after-move count = 3. Lance perigoso (leva a repeticao tripla).
    """
    pos_A = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2"
    pos_B = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"

    historico = [pos_A, pos_B, pos_B, pos_A]
    dangerous = check_repetition_danger(pos_A, historico)

    # O lance que leva a B (repetido) deve ser marcado como perigoso
    assert "g1f3" in dangerous
