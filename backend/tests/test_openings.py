"""
Testes para chess_logic/openings.py.

A deteccao de abertura para display vive no frontend
(frontend/src/utils/openings.js). Este modulo backend so cuida de
escolher a linha que o BOT vai jogar.
"""

from chess_logic.openings import (
    get_opening_line,
    get_opening_moves,
    OPENING_LINES,
    OPENING_LEVELS,
)


def test_get_opening_line_retorna_linha_valida():
    line = get_opening_line(1000)
    assert line is not None
    assert "moves" in line
    assert "name" in line
    assert len(line["moves"]) >= 4


def test_get_opening_line_nivel_200_apenas_aberturas_basicas():
    line = get_opening_line(200)
    assert line is not None
    assert line["name"] in ("Abertura Italiana", "Sistema Londres")


def test_get_opening_line_nivel_alto_permite_mais_aberturas():
    nomes_vistos = set()
    for _ in range(50):
        line = get_opening_line(1400)
        assert line is not None
        nomes_vistos.add(line["name"])
    assert len(nomes_vistos) > 3


def test_get_opening_line_nivel_desconhecido_nao_quebra():
    line = get_opening_line(9999)
    assert line is not None


def test_openings_lines_tem_estrutura_correta():
    for key, line in OPENING_LINES.items():
        assert "name" in line, f"{key} sem name"
        assert "moves" in line, f"{key} sem moves"
        assert "weight" in line, f"{key} sem weight"
        assert isinstance(line["moves"], list)
        assert len(line["moves"]) >= 2


def test_opening_levels_apontam_para_linhas_existentes():
    for nivel, chaves in OPENING_LEVELS.items():
        for chave in chaves:
            assert chave in OPENING_LINES, f"Nivel {nivel} aponta para {chave} inexistente"


# ------------------------------------------------------------
# get_opening_moves (sem estado global)
# ------------------------------------------------------------

def test_get_opening_moves_historico_vazio_retorna_primeiro_lance():
    move = get_opening_moves(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        1000,
        history=[],
    )
    assert move is not None
    assert len(move) >= 4


def test_get_opening_moves_historico_none_retorna_primeiro_lance():
    move = get_opening_moves(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        1000,
        history=None,
    )
    assert move is not None


def test_get_opening_moves_historico_incompativel_retorna_none():
    hist = [
        {"from": "a2", "to": "a3", "promotion": ""},
        {"from": "a7", "to": "a6", "promotion": ""},
    ]
    move = get_opening_moves("qualquerfen", 1000, history=hist)
    assert move is None


def test_get_opening_moves_sem_estado_global_entre_chamadas():
    """Duas chamadas com historicos diferentes nao devem interferir."""
    hist1 = []
    hist2 = [
        {"from": "e2", "to": "e4", "promotion": ""},
    ]
    r1 = get_opening_moves("fen1", 1000, history=hist1)
    r2 = get_opening_moves("fen2", 1000, history=hist2)
    # Chamar r1 nao deve mudar o resultado de r2
    r2_repetido = get_opening_moves("fen2", 1000, history=hist2)
    assert r2 == r2_repetido
